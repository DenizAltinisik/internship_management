from flask import Flask, request, jsonify
from flask_restful import Api, Resource
from flask_cors import CORS
from pymongo import MongoClient
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import bcrypt
import logging
import os
from bson import ObjectId

app = Flask(__name__)
api = Api(app)
CORS(app)  # Enable CORS for all origins

# Setup logging
logging.basicConfig(level=logging.DEBUG)

# Dosya yükleme için klasör oluşturma 
UPLOAD_FOLDER = 'uploads'
DEFAULT_PROFILE_PICTURE = 'uploads/default-profile.png'  # Varsayılan profil fotoğrafı yolu
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# MongoDB connection
try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client.intern_management
    logging.info("Connected to MongoDB successfully")
except Exception as e:
    logging.error(f"Failed to connect to MongoDB: {e}")

# JWT Configuration
app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'
jwt = JWTManager(app)

# Define status constants
STATUS_UNDONE = "undone"
STATUS_YAPILACAKLAR = "yapilacaklar"
STATUS_TEST_ASAMASI = "test_asamasi"
STATUS_YAPILDI = "yapildi"
STATUS_TAKEN = "taken"

# Add the task structure in user schema during registration
class UserRegistration(Resource):
    def post(self):
        data = request.get_json()
        if not data:
            return {"message": "No input data provided"}, 400

        email = data.get('email')
        password = data.get('password')
        name = data.get('name')
        surname = data.get('surname')
        phone = data.get('phone')
        school = data.get('school')
        department = data.get('department')
        role = data.get('role')

        if not email or not password or not name or not surname or not role:
            return {"message": "Email, password, name, surname, and role are required"}, 400

        if role not in ['admin', 'intern']:
            return {"message": "Role must be either 'admin' or 'intern'"}, 400

        # Hash the password
        try:
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            logging.info(f"Password hashed successfully for user: {email}")
        except Exception as e:
            logging.error(f"Password hashing failed: {e}")
            return {"message": "Password hashing failed"}, 500

        # Insert user data into MongoDB
        try:
            db.users.insert_one({
                "email": email, 
                "password": hashed_password, 
                "name": name, 
                "surname": surname, 
                "phone": phone, 
                "school": school, 
                "department": department,
                "role": role,
                "tasks": []  # Initialize tasks as an empty list
            })
            logging.info(f"User {email} registered successfully")
            return {"message": "User registered successfully"}, 201
        except Exception as e:
            logging.error(f"User registration failed: {e}")
            return {"message": str(e)}, 500

class UserLogin(Resource):
    def post(self):
        data = request.get_json()
        if not data:
            return {"message": "No input data provided"}, 400

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return {"message": "Email and password are required"}, 400

        # Query MongoDB to find user with matching email
        user = db.users.find_one({"email": email})

        if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
            access_token = create_access_token(identity=email)
            return {"message": "Login successful", "access_token": access_token}, 200
        else:
            return {"message": "Invalid credentials"}, 401

class ProtectedResource(Resource):
    @jwt_required()
    def get(self):
        current_user = get_jwt_identity()
        return {"message": f"Hello, {current_user}"}, 200

class UserProfile(Resource):
    @jwt_required()
    def get(self):
        current_user_email = get_jwt_identity()
        user = db.users.find_one({"email": current_user_email}, {"_id": 0, "password": 0})
        if user:
            return jsonify(user)
        else:
            return {"message": "User not found"}, 404
        
class UserProfileUpdate(Resource):
    @jwt_required()
    def put(self):
        data = request.form.to_dict()
        current_user_email = get_jwt_identity()

        update_fields = {
            "name": data.get('name'),
            "surname": data.get('surname'),
            "phone": data.get('phone'),
            "school": data.get('school'),
            "department": data.get('department'),
            "gender": data.get('gender'),
            "birthdate": data.get('birthdate'),
        }

        if 'profile_picture' in request.files:
            profile_picture_file = request.files['profile_picture']
            profile_picture_path = os.path.join(app.config['UPLOAD_FOLDER'], profile_picture_file.filename)
            profile_picture_file.save(profile_picture_path)
            update_fields["profile_picture"] = profile_picture_path

        try:
            result = db.users.update_one({"email": current_user_email}, {"$set": update_fields})
            if result.matched_count == 1:
                return {"message": "Profile updated successfully"}, 200
            else:
                return {"message": "User not found"}, 404
        except Exception as e:
            return {"message": str(e)}, 500

class UserTasks(Resource):
    @jwt_required()
    def get(self):
        current_user_email = get_jwt_identity()
        user = db.users.find_one({"email": current_user_email}, {"tasks": 1, "_id": 0})
        if user:
            return jsonify(user['tasks'])
        else:
            return {"message": "User not found"}, 404

class AddTask(Resource):
    @jwt_required()
    def post(self):
        try:
            data = request.get_json()
            app.logger.debug(f"Received data: {data}")

            if not data:
                return {"message": "No input data provided"}, 400

            task_header = data.get('header')
            task_details = data.get('details')
            task_status = data.get('status')

            if not task_header or not task_details or not task_status:
                return {"message": "Header, details, and status are required"}, 400

            current_user_email = get_jwt_identity()

            task = {
                "_id": str(ObjectId()),  # Generate a new ObjectId
                "header": task_header,
                "details": task_details,
                "status": task_status
            }

            db.users.update_one({"email": current_user_email}, {"$push": {"tasks": task}})
            return {"message": "Task added successfully"}, 201
        except Exception as e:
            app.logger.error(f"Error adding task: {e}")
            return {"message": str(e)}, 500
class UpdateTaskStatus(Resource):
    @jwt_required()
    def put(self):
        try:
            data = request.get_json()
            app.logger.debug(f"Received data for update: {data}")

            task_id = data.get('task_id')
            new_status = data.get('status')

            if not task_id or not new_status:
                return {"message": "Task ID and new status are required"}, 400

            current_user_email = get_jwt_identity()

            result = db.users.update_one(
                {"email": current_user_email, "tasks._id": task_id},
                {"$set": {"tasks.$.status": new_status}}
            )

            if result.modified_count == 1:
                return {"message": "Task status updated successfully"}, 200
            else:
                return {"message": "Task not found or no changes made"}, 404
        except Exception as e:
            app.logger.error(f"Error updating task status: {e}")
            return {"message": str(e)}, 500
        
api.add_resource(UserRegistration, '/register')
api.add_resource(UserLogin, '/login')
api.add_resource(ProtectedResource, '/protected')
api.add_resource(UserProfile, '/profile')
api.add_resource(UserProfileUpdate, '/profile')
api.add_resource(UserTasks, '/tasks')
api.add_resource(AddTask, '/addTask')
api.add_resource(UpdateTaskStatus, '/updateTaskStatus')

if __name__ == '__main__':
   app.run(debug=True, ssl_context=('server.crt', 'server.key'))

from flask import Flask, request, jsonify
from flask_restful import Api, Resource
from flask_cors import CORS
from pymongo import MongoClient
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import bcrypt
import logging
import os
from bson import ObjectId
from functools import wraps

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


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user_email = get_jwt_identity()
        user = db.users.find_one({"email": current_user_email})
        if user and user.get("role") == "admin":
            return fn(*args, **kwargs)
        else:
            return {"message": "Admin access required"}, 403
    return wrapper


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
                "profile_picture": None,  # Initialize profile_picture as None
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
            profile_picture_binary = profile_picture_file.read()  # Read file as binary
            update_fields["profile_picture"] = profile_picture_binary

        try:
            result = db.users.update_one({"email": current_user_email}, {"$set": update_fields})
            if result.matched_count == 1:
                return {"message": "Profile updated successfully"}, 200
            else:
                return {"message": "User not found"}, 404
        except Exception as e:
            return {"message": str(e)}, 500


class UserProfile(Resource):
    @jwt_required()
    def get(self):
        current_user_email = get_jwt_identity()
        user = db.users.find_one({"email": current_user_email}, {"_id": 0, "password": 0})

        if user:
            if user.get("profile_picture"):
                user["profile_picture"] = user["profile_picture"].decode('latin1')
            return jsonify(user)
        else:
            return {"message": "User not found"}, 404

class UserTasks(Resource):
    @jwt_required()
    def get(self):
        current_user_email = get_jwt_identity()
        user = db.users.find_one({"email": current_user_email}, {"tasks": 1, "name": 1, "surname": 1, "role": 1})
        role = user.get('role')
        
        if user:
            if role == 'intern':
                tasks = user['tasks']
                return jsonify(tasks)
            elif role == 'admin':
                tasks = list(db.users.find({}, {"tasks": 1, "_id": 0}))
                tasks = [task for user_tasks in tasks for task in user_tasks.get('tasks', [])]
                return jsonify(tasks)
            else:
                return {"message": "Unknown role"}, 400
        else:
            return {"message": "User not found"}, 404

class AddTask(Resource):
    @jwt_required()
    @admin_required
    def post(self):
        try:
            data = request.get_json()
            app.logger.debug(f"Received data: {data}")

            if not data:
                return {"message": "No input data provided"}, 400

            task_header = data.get('header')
            task_details = data.get('details')
            task_status = data.get('status')
            project_id = data.get('project_id')
            owner = data.get('owner')  # Yeni alan

            if not task_header or not task_details or not task_status or not project_id or not owner:
                return {"message": "Header, details, status, project_id, and owner are required"}, 400

            task = {
                "_id": str(ObjectId()),  # Generate a new ObjectId
                "header": task_header,
                "details": task_details,
                "status": task_status,
                "owner": owner,  # Görevi atanan intern
                "project_id": project_id
            }

            db.users.update_one({"email": owner}, {"$push": {"tasks": task}})
            return {"message": "Task added successfully", "task_id": task["_id"]}, 201
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

            result = db.users.update_one(
                {"tasks._id": task_id},
                {"$set": {"tasks.$.status": new_status}}
            )

            if result.modified_count == 1:
                return {"message": "Task status updated successfully"}, 200
            else:
                return {"message": "Task not found or no changes made"}, 404
        except Exception as e:
            app.logger.error(f"Error updating task status: {e}")
            return {"message": str(e)}, 500

class GetProjects(Resource):
    @jwt_required()
    def get(self):
        try:
            projects = list(db.projects.find({}))
            for project in projects:
                project['_id'] = str(project['_id'])
            return jsonify(projects)
        except Exception as e:
            return {"message": str(e)}, 500

class GetUserNames(Resource):
    @jwt_required()
    def get(self):
        try:
            users = db.users.find({}, {"email": 1, "name": 1, "surname": 1})
            user_names = {user['email']: f"{user['name']} {user['surname']}" for user in users}
            return jsonify(user_names)
        except Exception as e:
            return {"message": str(e)}, 500

class GetProjectTasks(Resource):
    @jwt_required()
    def get(self, project_id):
        try:
            tasks = list(db.users.aggregate([
                {"$unwind": "$tasks"},
                {"$match": {"tasks.project_id": project_id}},
                {"$replaceRoot": {"newRoot": "$tasks"}}
            ]))
            for task in tasks:
                task['_id'] = str(task['_id'])
            return jsonify(tasks)
        except Exception as e:
            return {"message": str(e)}, 500

class Interns(Resource):
    @jwt_required()
    def get(self):
        try:
            interns = db.users.find({"role": "intern"}, {"email": 1, "name": 1, "surname": 1, "_id": 0})
            interns_list = list(interns)
            return jsonify(interns_list)
        except Exception as e:
            return {"message": str(e)}, 500



class AddProject(Resource):
    @jwt_required()
    @admin_required
    def post(self):
        try:
            data = request.get_json()
            if not data:
                return {"message": "No input data provided"}, 400

            project_name = data.get('project_name')
            description = data.get('description')
            status = data.get('status')

            if not project_name or not description or not status:
                return {"message": "Project name, description, and status are required"}, 400

            project = {
                "project_name": project_name,
                "description": description,
                "status": status
            }

            db.projects.insert_one(project)
            return {"message": "Project added successfully"}, 201
        except Exception as e:
            return {"message": str(e)}, 500

class UpdateProject(Resource):
    @jwt_required()
    @admin_required
    def put(self, project_id):
        try:
            data = request.get_json()
            if not data:
                return {"message": "No input data provided"}, 400

            project_name = data.get('project_name')
            description = data.get('description')
            status = data.get('status')

            if not project_name or not description or not status:
                return {"message": "Project name, description, and status are required"}, 400

            project = {
                "project_name": project_name,
                "description": description,
                "status": status
            }

            result = db.projects.update_one({"_id": ObjectId(project_id)}, {"$set": project})
            if result.matched_count == 1:
                return {"message": "Project updated successfully"}, 200
            else:
                return {"message": "Project not found"}, 404
        except Exception as e:
            return {"message": str(e)}, 500

class DeleteProject(Resource):
    @jwt_required()
    @admin_required
    def delete(self, project_id):
        try:
            result = db.projects.delete_one({"_id": ObjectId(project_id)})
            if result.deleted_count == 1:
                return {"message": "Project deleted successfully"}, 200
            else:
                return {"message": "Project not found"}, 404
        except Exception as e:
            return {"message": str(e)}, 500

class AssignTaskToProject(Resource):
    @jwt_required()
    def post(self, project_id):
        try:
            data = request.get_json()
            task_id = data.get('task_id')

            if not task_id:
                return {"message": "Task ID is required"}, 400

            result = db.tasks.update_one({"_id": ObjectId(task_id)}, {"$set": {"project_id": project_id}})
            if result.matched_count == 1:
                return {"message": "Task assigned to project successfully"}, 200
            else:
                return {"message": "Task not found"}, 404
        except Exception as e:
            return {"message": str(e)}, 500


class DeleteTask(Resource):
    @jwt_required()
    @admin_required
    def delete(self, task_id):
        try:
            result = db.users.update_many(
                {"tasks._id": task_id},
                {"$pull": {"tasks": {"_id": task_id}}}
            )
            if result.modified_count > 0:
                return {"message": "Task deleted successfully"}, 200
            else:
                return {"message": "Task not found"}, 404
        except Exception as e:
            return {"message": str(e)}, 500

class UpdateTask(Resource):
    @jwt_required()
    @admin_required
    def put(self, task_id):
        try:
            data = request.get_json()
            app.logger.debug(f"Received data for update: {data}")

            update_fields = {
                "tasks.$.header": data.get('header'),
                "tasks.$.details": data.get('details'),
                "tasks.$.status": data.get('status'),
                "tasks.$.owner": data.get('owner')
            }

            # Önceki sahipten görevi kaldır
            db.users.update_one(
                {"tasks._id": task_id},
                {"$pull": {"tasks": {"_id": task_id}}}
            )

            # Yeni sahip ekle
            task = {
                "_id": task_id,
                "header": data.get('header'),
                "details": data.get('details'),
                "status": data.get('status'),
                "owner": data.get('owner'),
                "project_id": data.get('project_id')
            }
            db.users.update_one({"email": data.get('owner')}, {"$push": {"tasks": task}})

            return {"message": "Task updated successfully"}, 200
        except Exception as e:
            return {"message": str(e)}, 500



class GetTask(Resource):
    @jwt_required()
    def get(self, task_id):
        try:
            user = db.users.find_one({"tasks._id": task_id}, {"tasks.$": 1})
            if user and 'tasks' in user:
                return jsonify(user['tasks'][0])
            else:
                return {"message": "Task not found"}, 404
        except Exception as e:
            return {"message": str(e)}, 500




api.add_resource(UserRegistration, '/register')
api.add_resource(UserLogin, '/login')
api.add_resource(ProtectedResource, '/protected')
api.add_resource(UserProfile, '/profile')
api.add_resource(UserProfileUpdate, '/profile')
api.add_resource(UserTasks, '/tasks')
api.add_resource(AddTask, '/addTask')
api.add_resource(UpdateTaskStatus, '/update_task_status')
api.add_resource(GetProjects, '/get_projects')
api.add_resource(GetProjectTasks, '/get_project_tasks/<project_id>')
api.add_resource(GetUserNames, '/get_user_names')
api.add_resource(AddProject, '/add_project')
api.add_resource(UpdateProject, '/update_project/<project_id>')
api.add_resource(DeleteProject, '/delete_project/<project_id>')
api.add_resource(AssignTaskToProject, '/assign_task_to_project/<project_id>')
api.add_resource(Interns, '/interns')
api.add_resource(DeleteTask, '/delete_task/<task_id>')
api.add_resource(UpdateTask, '/update_task/<task_id>')
api.add_resource(GetTask, '/get_task/<task_id>')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

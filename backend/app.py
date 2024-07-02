from flask import Flask, request, jsonify
from flask_restful import Api, Resource
from flask_cors import CORS
from pymongo import MongoClient
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import bcrypt
import logging
import os

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

        if not email or not password or not name or not surname:
            return {"message": "Email, password and full name are required"}, 400

        # Hash the password
        try:
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            logging.info(f"Password hashed successfully for user: {email}")
        except Exception as e:
            logging.error(f"Password hashing failed: {e}")
            return {"message": "Password hashing failed"}, 500

        # Insert user data into MongoDB
        try:
            db.users.insert_one({"email": email, "password": hashed_password, "name": name, "surname": surname, "phone": phone, "school": school, "department": department})
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

api.add_resource(UserRegistration, '/register')
api.add_resource(UserLogin, '/login')
api.add_resource(ProtectedResource, '/protected')


@app.route('/add_user', methods=['POST'])
def add_user():
    data = request.form
    name = data.get('name')
    surname = data.get('surname')
    email = data.get('email')
    phone = data.get('phone')
    school = data.get('school')
    department = data.get('department')
    gender = data.get('gender')
    birthdate = data.get('birthdate')

    # Profil fotoğrafını yükleme
    profile_picture = DEFAULT_PROFILE_PICTURE  # Varsayılan olarak profil fotoğrafı
    if 'profile_picture' in request.files:
        profile_picture_file = request.files['profile_picture']
        profile_picture_path = os.path.join(app.config['UPLOAD_FOLDER'], profile_picture_file.filename)
        profile_picture_file.save(profile_picture_path)
        profile_picture = profile_picture_path

    if not name or not surname or not email or not phone or not school or not department or not gender or not birthdate:
        return jsonify({'error': 'All fields are required'}), 400

    user = {
        'name': name,
        'surname': surname,
        'email': email,
        'phone': phone,
        'school': school,
        'department': department,
        'profile_picture': profile_picture,
        'gender': gender,
        'birthdate': birthdate
    }

    db.users.insert_one(user)
    return jsonify({'message': 'User added successfully!'}), 201

@app.route('/get_user/<email>', methods=['GET'])
def get_user(email):
    user = db.users.find_one({'email': email})
    if user:
        return jsonify({
            'name': user['name'],
            'surname': user['surname'],
            'email': user['email'],
            'phone': user['phone'],
            'school': user['school'],
            'department': user['department'],
            'profile_picture': user['profile_picture'],
            'gender': user['gender'],
            'birthdate': user['birthdate']
        }), 200
    return jsonify({'error': 'User not found'}), 404

@app.route('/update_user/<email>', methods=['PUT'])
def update_user(email):
    data = request.form
    updated_user = {
        'name': data.get('name'),
        'surname': data.get('surname'),
        'email': data.get('email'),
        'phone': data.get('phone'),
        'school': data.get('school'),
        'department': data.get('department'),
        'gender': data.get('gender'),
        'birthdate': data.get('birthdate')
    }

    # Profil fotoğrafını güncelleme
    if 'profile_picture' in request.files:
        profile_picture_file = request.files['profile_picture']
        profile_picture_path = os.path.join(app.config['UPLOAD_FOLDER'], profile_picture_file.filename)
        profile_picture_file.save(profile_picture_path)
        updated_user['profile_picture'] = profile_picture_path
    elif not updated_user.get('profile_picture'):
        updated_user['profile_picture'] = DEFAULT_PROFILE_PICTURE

    result = db.users.update_one({'email': email}, {'$set': updated_user})
    if result.matched_count:
        return jsonify({'message': 'User updated successfully!'}), 200
    return jsonify({'error': 'User not found'}), 404


if __name__ == '__main__':
    # Use the generated certificates for HTTPS
    app.run(debug=True, ssl_context=('server.crt', 'server.key'))

from flask import Flask, request, jsonify
from flask_restful import Api, Resource
from flask_cors import CORS
from pymongo import MongoClient
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import bcrypt
import logging

app = Flask(__name__)
api = Api(app)
CORS(app)  # Enable CORS for all origins

# Setup logging
logging.basicConfig(level=logging.DEBUG)

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

        if not email or not password:
            return {"message": "Email and password are required"}, 400

        # Hash the password
        try:
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            logging.info(f"Password hashed successfully for user: {email}")
        except Exception as e:
            logging.error(f"Password hashing failed: {e}")
            return {"message": "Password hashing failed"}, 500

        # Insert user data into MongoDB
        try:
            db.users.insert_one({"email": email, "password": hashed_password})
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

if __name__ == '__main__':
    # Use the generated certificates for HTTPS
    app.run(debug=True, ssl_context=('server.crt', 'server.key'))

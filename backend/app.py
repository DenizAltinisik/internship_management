from flask import Flask, request, jsonify
from flask_restful import Api, Resource
from flask_jwt_extended import JWTManager, create_access_token
from pymongo import MongoClient

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'
api = Api(app)
jwt = JWTManager(app)

client = MongoClient("mongodb://localhost:27017/")
db = client.intern_management

class UserRegistration(Resource):
    def post(self):
        data = request.get_json()
        db.users.insert_one(data)
        return jsonify({"message": "User registered successfully"})

class UserLogin(Resource):
    def post(self):
        data = request.get_json()
        user = db.users.find_one({"email": data["email"]})
        if user and user["password"] == data["password"]:
            access_token = create_access_token(identity={"email": data["email"]})
            return jsonify(access_token=access_token)
        return jsonify({"message": "Invalid credentials"})

api.add_resource(UserRegistration, '/register')
api.add_resource(UserLogin, '/login')

if __name__ == '__main__':
    app.run(debug=True)

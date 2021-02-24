#
# HTTP server to play Chinese chess Xiangqi
#

# packages
from flask import Flask
from flask import request
import socket
import json

# define IP and PORT
IP = '127.0.0.1'
PORT = 8888

# bytes chunk to recieve
BYTES = 1024

# create app instance
app = Flask(__name__)

# test route
@app.route('/board')
def move():
    # extract user input data
    user_data = json.dumps(dict(request.args))
    
    # init client side socket
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    # send message to UDP server
    client_socket.sendto(str.encode(user_data), ((IP, PORT)))

    # receive response from server
    server_data, credentials = client_socket.recvfrom(BYTES)
    
    # convert server data to string
    server_data = server_data.decode()

    # close client socket
    client_socket.close()
    
    return 'user data ' + server_data

# main driver
if __name__ == '__main__':
    # run HTTP server
    app.run(debug=True, threaded=True)

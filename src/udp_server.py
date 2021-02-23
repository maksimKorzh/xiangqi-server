#
# UDP server
#

# import packages
import socket

# define IP and PORT
IP = '127.0.0.1'
PORT = 8888

# bytes chunk to recieve
BYTES = 1024

# create server side socket
server_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# bind server side socket to IP and PORT
server_socket.bind((IP, PORT))

# listen to incoming requests
while True:
    # receive request from client
    data, credentials = server_socket.recvfrom(BYTES)
    print('message:', data, credentials)
    
    # send response to client
    server_socket.sendto(b'server response', (credentials))
    print('sent response to client', credentials)

# close socket
server_socket.close()

#
# UDP server
#

# import packages
import socket
import json

# define IP and PORT
IP = '127.0.0.1'
PORT = 8888

# bytes chunk to recieve
BYTES = 1024

# create server side socket
server_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# bind server side socket to IP and PORT
server_socket.bind((IP, PORT))

# single game
game = {
    'id': False,
    'red': False,      # not "connected"
    'black': False,    # not "connected"
    'moves': []
}

# listen to incoming requests
while game['red'] == False or game['black'] == False:
    # receive request from client
    client_data, credentials = server_socket.recvfrom(BYTES)
    
    # parse client data
    client_data = json.loads(client_data.decode())
    print('message:', client_data, credentials)
    
    if client_data['move'] == 'connect':
        game[client_data['side']] = True
        game['id'] = client_data['gameId']
    
    # send response to client
    server_socket.sendto(str.encode(json.dumps(game)), (credentials))
    print('sent response to client', credentials)
    
    # connection established
    if game['red'] == True and game['black'] == True:
        print('game', game['id'], 'connection has been established')
        break

# close socket
server_socket.close()




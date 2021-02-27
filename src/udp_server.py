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

# available boards
boards = []

for index in range(5):
    boards.append( {
        'id': index + 1,
        'red': False,      # not "connected"
        'black': False,    # not "connected"
        'moves': []
    })



# listen to incoming requests
while True:
    # receive request from client
    client_data, credentials = server_socket.recvfrom(BYTES)
    
    # parse client data
    client_data = json.loads(client_data.decode())
    print('client:', client_data, credentials)
    
    # init game
    try:
        game = boards[int(client_data['gameId']) - 1]

    except Exception as e:
        print(e)
        server_socket.sendto(b'board does not exist!', (credentials))
        continue
    
    if client_data['move'] == 'connect':
        game[client_data['side']] = True
    elif client_data['move'] == 'disconnect':
        boards[int(client_data['gameId']) - 1] = {
            'id': int(client_data['gameId']),
            'red': False,      # not "connected"
            'black': False,    # not "connected"
            'moves': []
        }
    elif client_data['move'] != 'get':
        game['moves'].append(int(client_data['move']))
        print('got move from UI')
    
    # send response to client
    server_socket.sendto(str.encode(json.dumps(game)), (credentials))
    print('sent response to client', credentials)

# close socket
server_socket.close()




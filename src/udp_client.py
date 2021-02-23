#
# UDP client for testing
#

# import packages
import socket

# define IP and PORT
IP = '127.0.0.1'
PORT = 8888

# bytes chunk to recieve
BYTES = 1024

# init client side socket
client_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# send message to UDP server
client_socket.sendto(b'request from client', ((IP, PORT)))

# receive response from server
data, credentials = client_socket.recvfrom(BYTES)
print('message:', data, credentials)

# close client socket
client_socket.close()

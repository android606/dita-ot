#!/usr/bin/env node
/**
 * Socket Communication Demo
 * This demonstrates how the Discord Bot CLI socket communication works
 */

const net = require('net');
const fs = require('fs');

console.log('🔌 Discord Bot CLI - Socket Communication Demo');
console.log('==============================================');

// Create a mock socket server to demonstrate the protocol
const socketPath = '/tmp/discord_demo.sock';

// Clean up any existing socket
if (fs.existsSync(socketPath)) {
    fs.unlinkSync(socketPath);
}

const server = net.createServer((socket) => {
    console.log('📡 Client connected to socket');
    
    let buffer = '';
    
    socket.on('data', (data) => {
        buffer += data.toString();
        
        // Process complete messages (newline delimited)
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer
        
        lines.forEach(line => {
            if (line.trim()) {
                try {
                    const message = JSON.parse(line);
                    console.log('📨 Received message:', message);
                    
                    // Mock responses based on command
                    let response = {};
                    
                    switch (message.command) {
                        case 'status':
                            response = {
                                success: true,
                                data: {
                                    connected: true,
                                    ready: true,
                                    user: 'DemoBot#1234',
                                    guilds: 1,
                                    channels: 1
                                }
                            };
                            break;
                            
                        case 'send':
                            response = {
                                success: true,
                                data: {
                                    messageId: '123456789012345678',
                                    content: message.content,
                                    timestamp: new Date().toISOString()
                                }
                            };
                            console.log(`📤 Would send to Discord: "${message.content}"`);
                            break;
                            
                        case 'get_messages':
                            response = {
                                success: true,
                                data: {
                                    messages: [
                                        {
                                            id: '111111111111111111',
                                            content: 'Hello from Discord!',
                                            author: 'TestUser#5678',
                                            timestamp: new Date().toISOString()
                                        },
                                        {
                                            id: '222222222222222222',
                                            content: 'This is a test message',
                                            author: 'AnotherUser#9012',
                                            timestamp: new Date().toISOString()
                                        }
                                    ]
                                }
                            };
                            break;
                            
                        default:
                            response = {
                                success: false,
                                error: 'Unknown command: ' + message.command
                            };
                    }
                    
                    // Send response
                    socket.write(JSON.stringify(response) + '\n');
                    console.log('📤 Sent response:', response);
                    
                } catch (error) {
                    console.error('❌ Error parsing message:', error.message);
                    socket.write(JSON.stringify({
                        success: false,
                        error: 'Invalid JSON: ' + error.message
                    }) + '\n');
                }
            }
        });
    });
    
    socket.on('close', () => {
        console.log('📡 Client disconnected');
    });
    
    socket.on('error', (error) => {
        console.error('❌ Socket error:', error.message);
    });
});

server.listen(socketPath, () => {
    console.log(`🚀 Mock Discord Bot server started on ${socketPath}`);
    console.log('📋 Available commands:');
    console.log('  - {"command": "status"}');
    console.log('  - {"command": "send", "content": "Hello World!"}');
    console.log('  - {"command": "get_messages"}');
    console.log('');
    console.log('🔌 Test with: echo \'{"command": "status"}\' | socat - UNIX-CONNECT:' + socketPath);
    console.log('');
    
    // Auto-test after a short delay
    setTimeout(() => {
        console.log('🧪 Running automatic tests...');
        testSocketCommunication();
    }, 1000);
});

function testSocketCommunication() {
    const client = net.createConnection(socketPath);
    let testCount = 0;
    const totalTests = 3;
    
    client.on('connect', () => {
        console.log('✅ Client connected for testing');
        
        // Test 1: Status command
        console.log('🧪 Test 1: Status command');
        client.write(JSON.stringify({command: 'status'}) + '\n');
    });
    
    client.on('data', (data) => {
        const response = JSON.parse(data.toString().trim());
        console.log('📨 Response:', response);
        
        testCount++;
        
        if (testCount === 1) {
            // Test 2: Send message
            console.log('🧪 Test 2: Send message');
            client.write(JSON.stringify({
                command: 'send',
                content: 'Hello from socket test! This would be sent to Discord.'
            }) + '\n');
        } else if (testCount === 2) {
            // Test 3: Get messages
            console.log('🧪 Test 3: Get messages');
            client.write(JSON.stringify({command: 'get_messages'}) + '\n');
        } else if (testCount === 3) {
            console.log('✅ All socket tests completed!');
            client.end();
            
            // Clean up
            setTimeout(() => {
                server.close();
                if (fs.existsSync(socketPath)) {
                    fs.unlinkSync(socketPath);
                }
                console.log('🧹 Cleanup completed');
                process.exit(0);
            }, 1000);
        }
    });
    
    client.on('error', (error) => {
        console.error('❌ Client error:', error.message);
    });
}

// Handle cleanup on exit
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down demo server...');
    server.close();
    if (fs.existsSync(socketPath)) {
        fs.unlinkSync(socketPath);
    }
    process.exit(0);
});
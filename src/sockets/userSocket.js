// backend/src/sockets/userSocket.js
module.exports = function (io, socket) {
    // เมื่อผู้ใช้เข้าสู่ระบบ (สามารถส่งข้อมูลผู้ใช้ไปได้)
    socket.on('userLogin', (userData) => {
      console.log('User logged in:', userData);
      
      // ส่งข้อมูลไปยังผู้ใช้ทุกคนหรือผู้ใช้เฉพาะที่จำเป็น
      socket.emit('loginSuccess', { message: 'Welcome back!' });
    });
  
    // เมื่อผู้ใช้ออกจากระบบ
    socket.on('userLogout', (userId) => {
      console.log('User logged out:', userId);
      socket.disconnect();
    });
  };
  
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'conversation_analytics',
  charset: 'utf8mb4'
});

connection.connect(function(err) {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }

  console.log('Connected to database');

  // Check users with admin or manager role
  connection.query('SELECT uuid, username, role, branch_id FROM users', function(err, results) {
    if (err) {
      console.error('Error querying users:', err);
      connection.end();
      return;
    }

    console.log('All users in database:');
    console.log(results);

    // Try to find a user to promote to manager
    const regularUsers = results.filter(user => user.role === 'user');
    if (regularUsers.length > 0) {
      const userToPromote = regularUsers[0];
      console.log('\nPromoting user to manager:', userToPromote.username);
      
      // Update the first regular user to be a manager
      connection.query(
        'UPDATE users SET role = "manager", branch_id = "BRANCH_001" WHERE uuid = ?',
        [userToPromote.uuid],
        function(err, result) {
          if (err) {
            console.error('Error updating user role:', err);
          } else {
            console.log('Successfully promoted user to manager');
          }
          connection.end();
        }
      );
    } else {
      console.log('\nNo regular users found to promote');
      connection.end();
    }
  });
});

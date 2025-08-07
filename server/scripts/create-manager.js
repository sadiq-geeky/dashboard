const mysql = require('mysql2/promise');

async function createManagerUser() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'conversation_analytics',
      charset: 'utf8mb4'
    });

    console.log('Connected to database');

    // First, check existing users
    const [users] = await connection.execute('SELECT uuid, username, role, emp_name FROM users WHERE is_active = true');
    console.log('All active users:');
    console.log(users);

    // Find the first regular user to promote
    const regularUser = users.find(user => user.role === 'user');
    
    if (regularUser) {
      console.log(`\nPromoting user "${regularUser.username}" to manager...`);
      
      // Update user role to manager and assign to branch
      const [result] = await connection.execute(
        'UPDATE users SET role = "manager" WHERE uuid = ?',
        [regularUser.uuid]
      );
      
      console.log('Manager user created successfully!');
      console.log(`Username: ${regularUser.username}`);
      console.log(`Role: manager`);
      
      // Try to link to a branch if branches exist
      const [branches] = await connection.execute('SELECT id, branch_city FROM branches LIMIT 1');
      if (branches.length > 0) {
        const branch = branches[0];
        
        // Check if link_device_branch_user table exists and has the user
        try {
          const [existingLinks] = await connection.execute(
            'SELECT * FROM link_device_branch_user WHERE user_id = ?',
            [regularUser.uuid]
          );
          
          if (existingLinks.length > 0) {
            // Update existing link
            await connection.execute(
              'UPDATE link_device_branch_user SET branch_id = ? WHERE user_id = ?',
              [branch.id, regularUser.uuid]
            );
            console.log(`Manager linked to branch: ${branch.branch_city}`);
          } else {
            // Create new link if possible (need device_id)
            console.log(`Branch available: ${branch.branch_city} (${branch.id})`);
            console.log('Note: Manager should be manually linked to devices/branches in the admin interface');
          }
        } catch (linkError) {
          console.log('Could not link to branch automatically:', linkError.message);
        }
      }
    } else {
      console.log('\nNo regular users found to promote to manager.');
      console.log('Available users:');
      users.forEach(user => {
        console.log(`- ${user.username} (${user.role})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createManagerUser();

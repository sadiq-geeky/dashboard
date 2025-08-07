import { connection } from '../config/database';
import util from 'util';

async function checkUsers() {
  try {
    const query = util.promisify(connection.query).bind(connection);
    const users = await query('SELECT uuid, username, role, branch_id FROM users WHERE role = "manager" OR role = "admin"');
    console.log('Users with admin or manager role:');
    console.log(users);
    
    // Also check all users
    const allUsers = await query('SELECT uuid, username, role, branch_id FROM users');
    console.log('\nAll users:');
    console.log(allUsers);
    
    connection.end();
  } catch (error) {
    console.error('Error:', error);
    connection.end();
  }
}

checkUsers();

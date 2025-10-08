import bcrypt from 'bcrypt';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function hashPassword() {
  rl.question('Masukkan password yang ingin di-hash: ', async (password) => {
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      console.log('\n=== HASIL HASHING ===');
      console.log('Password asli:', password);
      console.log('Password hash:', hashedPassword);
      console.log('\n=== SQL QUERY ===');
      console.log('INSERT INTO user (nama, password, no_telp)');
      console.log(`VALUES ('admin', '${hashedPassword}', '08123456789');`);
      console.log('\nCopy hash di atas untuk insert ke database!');
    } catch (error) {
      console.error('Error hashing password:', error);
    } finally {
      rl.close();
    }
  });
}

hashPassword();
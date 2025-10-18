const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function hashPassword() {
  try {
    const password = await askQuestion('Masukkan password yang ingin di-hash: ');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log('\n=== HASIL HASHING ===');
    console.log('Password asli:', password);
    console.log('Password hash:', hashedPassword);
    console.log('\n=== SQL QUERY ===');
    console.log('INSERT INTO user (nama, password, email)');
    console.log(`VALUES ('admin', '${hashedPassword}', 'raisarazaf@gmail.com');`);

    rl.close();
  } catch (error) {
    console.error('Error hashing password:', error);
    rl.close();
  }
}

hashPassword();
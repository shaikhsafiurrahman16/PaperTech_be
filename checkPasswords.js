const bcrypt = require('bcrypt');
const hashes = [
  '$2b$12$/wYXZVA5CgK.nKtEZMBUmOo.Ppp6T3rMCQQxyIRO9L385XvelXGv.',
  '$2b$12$cXHJVumIDVSBQTH7NqQKMOW0mRG1obVs9XgMd8fZKnCZMV9/G2eVy'
];
const passwords = ['admin','password','admin123','123456','abc123','customer1','customer2'];
(async () => {
  for (const hash of hashes) {
    for (const pwd of passwords) {
      const ok = await bcrypt.compare(pwd, hash);
      if (ok) console.log('MATCH', pwd, hash);
    }
  }
})();

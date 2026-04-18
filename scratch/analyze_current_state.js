import { users } from '../src/data/users.js';
import { funcionariosBirthdays } from '../src/data/birthdays.js';

const normalize = (str) => {
    return str.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z]/g, "");
};

const generateEmail = (fullName) => {
    const cleanName = fullName.replace(/\*/g, '').trim();
    const parts = cleanName.split(/\s+/);
    let firstName = '';
    let firstApellido = '';
    
    if (parts.length >= 3) {
        firstName = parts[2];
        firstApellido = parts[0];
    } else if (parts.length === 2) {
        firstName = parts[1];
        firstApellido = parts[0];
    } else {
        firstName = parts[0];
        firstApellido = 'error';
    }
    return `${normalize(firstName)}.${normalize(firstApellido)}@slepla.gob.cl`;
};

console.log("Analysis of Users and Emails:");

const missingInUsers = [];
const existingEmails = new Set(users.map(u => u.email));

for (const f of funcionariosBirthdays) {
    const generated = generateEmail(f.nombre);
    if (!existingEmails.has(generated)) {
        missingInUsers.push({
            nombre: f.nombre,
            cargo: f.cargo,
            suggestedEmail: generated
        });
    }
}

console.log("\n--- Officials in birthdays.js NOT in users.js ---");
console.log(JSON.stringify(missingInUsers, null, 2));

console.log("\n--- Current users.js status ---");
users.forEach(u => {
    console.log(`${u.id}: ${u.name} -> ${u.email}`);
});

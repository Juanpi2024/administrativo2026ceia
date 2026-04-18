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

// Create a map of existing emails to users
const emailToUser = {};
users.forEach(u => {
    emailToUser[u.email] = u;
});

const finalUsers = [...users];
let nextId = Math.max(...users.map(u => u.id)) + 1;

for (const f of funcionariosBirthdays) {
    const email = generateEmail(f.nombre);
    
    // Check if this email already exists in users.js
    if (!emailToUser[email]) {
        // If not, add a new user
        const newUser = {
            id: nextId++,
            name: f.nombre.replace(/\*/g, '').trim(),
            email: email,
            role: "lector" // Default role
        };
        
        // Specialize role if it's admin or something visible in name?
        // Actually, just keep lector for now unless it's obviously special.
        if (f.cargo && f.cargo.toLowerCase().includes("directiva")) {
           // We might want to see if we can infer more, but "lector" is safe.
        }
        
        finalUsers.push(newUser);
        emailToUser[email] = newUser;
        console.log(`Added: ${newUser.name} -> ${newUser.email}`);
    } else {
        // Update existing user name if it's too short?
        const existing = emailToUser[email];
        // If names are very different, maybe update name to the full one
        if (existing.name.split(' ').length < 2 && f.nombre.split(' ').length > 2) {
             existing.name = f.nombre.replace(/\*/g, '').trim();
             console.log(`Updated name for ${email}: ${existing.name}`);
        }
    }
}

console.log(`Final user count: ${finalUsers.length}`);

// Output the new users.js
import fs from 'fs';
const fileContent = `export const users = ${JSON.stringify(finalUsers, null, 4)};

// Helper to find all employees associated with the centralized email
export const getEmployeesByEmail = (email) => {
    return users.filter(user => user.email === email);
};

export const findUserByEmail = (email) => {
    return users.find(u => u.email === email);
}`;

fs.writeFileSync('./src/data/users.js', fileContent);
console.log('users.js updated successfully');

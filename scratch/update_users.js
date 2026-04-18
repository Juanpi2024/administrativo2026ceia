import { users } from '../src/data/users.js';
import { funcionariosBirthdays } from '../src/data/birthdays.js';
import fs from 'fs';

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

const updatedUsers = users.map(user => {
    const userParts = user.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(p => p.length > 2);
    
    let matchedEmail = null;
    for (const f of funcionariosBirthdays) {
        const birthdayNameNormalized = f.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const birthdayParts = birthdayNameNormalized.split(/\s+/);
        const matchCount = userParts.filter(up => birthdayParts.some(bp => bp.includes(up) || up.includes(bp))).length;
        
        if (matchCount >= 2) {
            matchedEmail = generateEmail(f.nombre);
            break;
        }
    }

    let newEmail = matchedEmail;
    
    if (!newEmail) {
        const parts = user.name.trim().split(/\s+/);
        if (parts.length >= 2) {
            let fn = parts[0];
            let fa = parts[parts.length - 1];
            if (parts.length > 2) fa = parts[1];
            newEmail = `${normalize(fn)}.${normalize(fa)}@slepla.gob.cl`;
        } else {
            newEmail = user.email;
        }
    }
    
    return { ...user, email: newEmail };
});

const fileContent = `export const users = ${JSON.stringify(updatedUsers, null, 4)};

// Helper to find all employees associated with the centralized email
export const getEmployeesByEmail = (email) => {
    return users.filter(user => user.email === email);
};

export const findUserByEmail = (email) => {
    return users.find(u => u.email === email);
}`;

fs.writeFileSync('./src/data/users.js', fileContent);
console.log('File updated successfully');

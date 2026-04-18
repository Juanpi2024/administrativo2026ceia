import { users } from '../src/data/users.js';
import { funcionariosBirthdays } from '../src/data/birthdays.js';
import fs from 'fs';

const normalizeStr = (str) => {
    return str.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z ]/g, ""); // Keep spaces
};

const getInstitutionalEmail = (fullName) => {
    const cleanName = fullName.replace(/\*/g, '').trim();
    // Normalize parts for email generation
    const parts = normalizeStr(cleanName).split(/\s+/).filter(p => p.length > 0);
    
    let firstName = '';
    let firstApellido = '';

    if (parts.length >= 3) {
        // APELLIDO_P APELLIDO_M NOMBRE1 ...
        firstName = parts[2];
        firstApellido = parts[0];
    } else if (parts.length === 2) {
        firstName = parts[1];
        firstApellido = parts[0];
    } else {
        firstName = parts[0];
        firstApellido = 'unknown';
    }

    return `${firstName}.${firstApellido}@slepla.gob.cl`;
};

const updatedUsers = users.map(user => {
    const normalizedUserInput = normalizeStr(user.name);
    const userParts = normalizedUserInput.split(/\s+/).filter(p => p.length > 2);
    
    let bestMatch = null;
    let maxMatches = 0;

    for (const f of funcionariosBirthdays) {
        const normalizedBirthdayName = normalizeStr(f.nombre);
        const birthdayParts = normalizedBirthdayName.split(/\s+/).filter(p => p.length > 2);
        
        const matches = userParts.filter(up => birthdayParts.includes(up)).length;
        
        if (matches > maxMatches) {
            maxMatches = matches;
            bestMatch = f;
        }
    }

    if (bestMatch && maxMatches >= 2) {
        return { ...user, email: getInstitutionalEmail(bestMatch.nombre) };
    }
    
    // Fallback logic
    const parts = normalizeStr(user.name).split(/\s+/).filter(p => p.length > 0);
    let fn = parts[parts.length - 1]; // First Name is usually last in APELLIDO NOMBRE format or first in NOMBRE APELLIDO
    let fa = parts[0];

    // Check if parts[0] is usually a name or surname?
    // In users.js we have:
    // "Alegría Vanesa" -> FA=Alegria, FN=Vanesa
    // "Juan José Araya" -> FA=Juan, FN=Araya? No.
    
    return { ...user, email: `REVIEW_${user.email}` };
});

const output = updatedUsers.map(u => ({ id: u.id, name: u.name, email: u.email }));
console.log(JSON.stringify(output, null, 2));

const fileContent = `export const users = ${JSON.stringify(updatedUsers, null, 4)};

// Helper to find all employees associated with the centralized email
export const getEmployeesByEmail = (email) => {
    return users.filter(user => user.email === email);
};

export const findUserByEmail = (email) => {
    return users.find(u => u.email === email);
}`;

fs.writeFileSync('./src/data/users.js', fileContent);

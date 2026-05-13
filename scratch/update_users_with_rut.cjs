const fs = require('fs');

const data = [
  { nombre: "LUIS ALBERTO", paterno: "PARADA", materno: "RAMOS", rut: "10226364-2" },
  { nombre: "SAMUEL", paterno: "CONTRERAS", materno: "FLORES", rut: "9146521-3" },
  { nombre: "JORGE RAÚL", paterno: "CANCINO", materno: "CANCINO", rut: "8996141-6" },
  { nombre: "MARÍA DE LOS ANGELES", paterno: "CANALES", materno: "AMIGO", rut: "8977019-K" },
  { nombre: "ENRIQUE ANTONIO", paterno: "URRUTIA", materno: "RUIZ", rut: "8789227-1" },
  { nombre: "LUIS ROBERTO", paterno: "HERNÁNDEZ", materno: "GUERRERO", rut: "7737569-4" },
  { nombre: "KEILI JOHANA", paterno: "JIMENEZ", materno: "JIMENEZ", rut: "27048216-3" },
  { nombre: "RODRIGO JESÚS", paterno: "PONCE", materno: "CANDIA", rut: "20596852-0" },
  { nombre: "MARÍA JOSÉ", paterno: "ANDRADES", materno: "INOSTROZA", rut: "20316347-9" },
  { nombre: "CÉSAR MAURICIO", paterno: "VALLEJOS", materno: "MONROY", rut: "18982977-9" },
  { nombre: "DANIELA JOSÉ", paterno: "NAVARRETE", materno: "VÁSQUEZ", rut: "18920251-2" },
  { nombre: "CONSTANZA NATALY", paterno: "LEIVA", materno: "MUÑOZ", rut: "18894305-5" },
  { nombre: "DANIEL ABRAHAM", paterno: "SCARLAZZETTA", materno: "SEPÚLVEDA", rut: "18362031-2" },
  { nombre: "ELIZABETH ANDREA", paterno: "MONJES", materno: "AGURTO", rut: "17090686-1" },
  { nombre: "JUAN LUIS", paterno: "VALDÉS", materno: "MÉNDEZ", rut: "15920961-K" },
  { nombre: "INGRID JOHANNA", paterno: "SEPÚLVEDA", materno: "FUENTES", rut: "15431516-0" },
  { nombre: "XIMENA INGRID", paterno: "ARRIAGADA", materno: "SEPÚLVEDA", rut: "14399711-1" },
  { nombre: "JUAN PABLO", paterno: "RAMÍREZ", materno: "YÁÑEZ", rut: "14023687-K" },
  { nombre: "VANESSA DE LOURDES", paterno: "ALEGRÍA", materno: "MARTÍNEZ", rut: "13615557-1" },
  { nombre: "ROSICLER PAULINA", paterno: "URRA", materno: "ESPINOSA", rut: "12186325-1" },
  { nombre: "RAMÓN LEONARDO", paterno: "RETAMAL", materno: "DUFFAU", rut: "10825508-0" },
  
  { nombre: "VERÓNICA CECILIA", paterno: "SAAVEDRA", materno: "BASCUÑÁN", rut: "10835852-1" },
  { nombre: "YESSICA BEATRIZ", paterno: "POBLETE", materno: "ÓRDENES", rut: "11768693-0" },
  { nombre: "PABLO RODRIGO", paterno: "PALMA", materno: "CONTRERAS", rut: "12545258-2" },
  { nombre: "JUAN JOSÉ", paterno: "ARAYA", materno: "CHANDÍA", rut: "12545717-7" },
  { nombre: "GUILLERMO AGUSTIN", paterno: "SEPÚLVEDA", materno: "MAUREIRA", rut: "12966640-4" },
  { nombre: "BETSABÉ MACARENA", paterno: "GONZÁLEZ", materno: "BUSTOS", rut: "14023539-3" },
  { nombre: "CLAUDIA ANDREA", paterno: "LÓPEZ", materno: "ARANCIBIA", rut: "15825870-6" },
  { nombre: "MATÍAS ALEJANDRO", paterno: "BATARCE", materno: "HERNÁNDEZ", rut: "16270328-5" },
  { nombre: "MARÍA CONSUELO", paterno: "ALVEAR", materno: "MONTERO", rut: "17044792-1" },
  { nombre: "VERÓNICA ALEJANDRA", paterno: "FUENTES", materno: "GONZÁLEZ", rut: "17091484-8" },
  { nombre: "OMAR ENRIQUE", paterno: "ALVIAL", materno: "SALDÍAS", rut: "17717651-6" },
  { nombre: "KATHERINE VANESSA", paterno: "RODRÍGUEZ", materno: "RÍOS", rut: "18286531-1" },
  { nombre: "KARLA ANDREA", paterno: "BURGOS", materno: "LARA", rut: "18475309-K" },
  { nombre: "DAVID IGNACIO", paterno: "GUAJARDO", materno: "LOBOS", rut: "18559809-8" },
  { nombre: "MARÍA FRANCISCA", paterno: "ÁVILA", materno: "SÁNCHEZ", rut: "19990651-8" },
  { nombre: "MARÍA ANGÉLICA", paterno: "MOYA", materno: "ARROYO", rut: "8727669-4" }
];

const removeAccents = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

let usersContent = fs.readFileSync('src/data/users.js', 'utf8');
const match = usersContent.match(/export const users = (\[[\s\S]*?\]);/);
if (!match) {
    console.error("Could not parse users.js");
    process.exit(1);
}

let existingUsers = JSON.parse(match[1]);
let maxId = existingUsers.reduce((max, u) => u.id > max ? u.id : max, 0);

// For each existing user, try to find a match and add rut.
existingUsers = existingUsers.map(u => {
    // If user already has rut, keep it (though they probably don't)
    if (u.rut) return u;

    const lowerName = removeAccents(u.name);
    // Find in data
    let found = data.find(d => {
        const parts = [removeAccents(d.nombre), removeAccents(d.paterno), removeAccents(d.materno)].filter(Boolean);
        // check if most parts exist in the existing name
        let matched = 0;
        for (let part of parts) {
            for(let sub of part.split(" ")) {
                if(lowerName.includes(sub)) matched++;
            }
        }
        return matched >= 2; // At least two words match
    });
    
    if (found) {
        // Also reformat the name
        u.name = `${found.nombre} ${found.paterno} ${found.materno}`.trim();
        u.rut = found.rut;
    }
    return u;
});

// For any data that didn't match, create a new user
data.forEach(d => {
    let alreadyExists = existingUsers.some(u => u.rut === d.rut);
    if (!alreadyExists) {
        maxId++;
        const fullName = `${d.nombre} ${d.paterno} ${d.materno}`.trim();
        // create a basic email
        const emailFirst = d.nombre.split(" ")[0].toLowerCase();
        const emailLast = d.paterno.toLowerCase();
        const email = removeAccents(`${emailFirst}.${emailLast}@slepla.gob.cl`);
        
        existingUsers.push({
            id: maxId,
            name: fullName,
            email: email,
            role: "lector",
            rut: d.rut
        });
        console.log("Added new user:", fullName);
    }
});

const newContent = `export const users = ${JSON.stringify(existingUsers, null, 4)};\n\n// Helper to find all employees associated with the centralized email\nexport const getEmployeesByEmail = (email) => {\n    return users.filter(user => user.email === email);\n};\n\nexport const findUserByEmail = (email) => {\n    return users.find(u => u.email === email);\n}`;

fs.writeFileSync('src/data/users.js', newContent);
console.log("Updated users.js successfully.");

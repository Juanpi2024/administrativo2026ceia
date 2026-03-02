export const users = [
    { id: 1, name: 'Alegría Vanesa', email: 'vane19alegria@gmail.com', role: 'lector' },
    { id: 2, name: 'Alvear Montero María Consuelo', email: 'maria.alvear.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 3, name: 'Alvial Saldias Omar Enrique', email: 'omar.alvial.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 4, name: 'Arriagada Sepúlveda Ximena Ingrid', email: 'ximena.arriagada.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 5, name: 'Ávila Sánchez María Francisca', email: 'maria.avila.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 6, name: 'Batarce Hernández Matías Alejandro', email: 'matias.batarce.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 7, name: 'Canales Amigo María De Los Ángeles', email: 'maria.canales.ceia@eduilustreparral.cl', role: 'emisor' },
    { id: 8, name: 'Cancino Cancino Jorge Raúl', email: 'jorge.cancino.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 9, name: 'Fuentes González Verónica Alejandra', email: 'veronica.fuentes.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 10, name: 'González Bustos Betsabe Macarena', email: 'betsabe.gonzalez.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 11, name: 'Guajardo Lobos David Ignacio', email: 'david.guajardo.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 12, name: 'Hernández Guerrero Luis Roberto', email: 'juan.ramirez.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 13, name: 'Leiva Muñoz Constanza Nataly', email: 'constanza.leiva.ceia@eduilustreparral.cl', role: 'emisor' },
    { id: 14, name: 'Morales Sepúlveda María José', email: 'maria.morales.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 15, name: 'Morales Velásquez Miguel Ángel', email: 'miguel.morales.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 16, name: 'Palma Contreras Pablo Rodrigo', email: 'pablo.palma.ceia@eduilustreparral.cl', role: 'administrador' },
    { id: 17, name: 'Parada Ramos Luis Alberto', email: 'luis.parada.ceia@eduilustreparral.cl', role: 'emisor' },
    { id: 18, name: 'Ponce Candia Rodrigo De Jesús', email: 'rodrigo.ponce.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 19, name: 'Ramírez Yáñez Juan Pablo', email: 'juan.ramirez.ceia@eduilustreparral.cl', role: 'emisor', sub_role: 'Administrativo y Adquisiciones' },
    { id: 20, name: 'Retamal Duffau Ramón Leonardo', email: 'ramon.retamal.ceia@eduilustreparral.cl', role: 'emisor' },
    { id: 21, name: 'Robles Pinto Flavio Rigoberto', email: 'flavio.robles.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 22, name: 'Saavedra Bascuñán Verónica Cecilia', email: 'veronica.saavedra.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 23, name: 'Sepúlveda Fuentes Ingrid Johanna', email: 'ingrid.sepulveda.ceia@eduilustreparral.cl', role: 'emisor' },
    { id: 24, name: 'Sepúlveda Maureira Guillermo Agustín', email: 'guillermo.sepulveda.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 25, name: 'Soto Parra Carolina Alejandra', email: 'carolina.soto.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 26, name: 'Urrutia Ruiz Enrique Antonio', email: 'juan.ramirez.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 27, name: 'Valdés Méndez Juan Luis', email: 'juan.ramirez.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 28, name: 'Vallejos Monroy Cesar Mauricio', email: 'cesar.vallejos.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 29, name: 'Karla Burgos Lara', email: 'karla.burgos.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 30, name: 'Matias Morales', email: 'matias.morales.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 31, name: 'Elizabeth monjes', email: 'juan.ramirez.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 32, name: 'Yessica Poblete Ordenes', email: 'yessica.poblete.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 33, name: 'claudia lopez', email: 'juan.ramirez.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 34, name: 'Contreras Samuel', email: 'juan.ramirez.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 35, name: 'Daniel Scarlazzetta', email: 'daniel.scarlazzetta.ceia@eduilustreparral.cl', role: 'lector' },
    { id: 36, name: 'Juan José Araya', email: 'juan.araya.ceia@eduilustreparral.cl', role: 'administrador', sub_role: 'Director' }
];

// Helper to find all employees associated with the centralized email
export const getEmployeesByEmail = (email) => {
    return users.filter(user => user.email === email);
};

export const findUserByEmail = (email) => {
    return users.find(u => u.email === email);
}

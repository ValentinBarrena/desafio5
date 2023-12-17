import { Router } from 'express'
import User from '../models/user.model.js'

const router = Router()

// Creamos un pequeño middleware para una autorización básica
// Observar que aparece next, además de req y res.
// next nos permite continuar la secuencia de la "cadena".
// En este caso, si el usuario es admin, llamanos a next, caso contrario
// devolvemos un error 403 (Forbidden), no se puede acceder al recurso.
// Si ni siquiera se dispone de req.session.user, directamente devolvemos error
// de no autorizado.
const auth = (req, res, next) => {
    try {
        if (req.session.user) {
            if (req.session.user.rol === 'ADMIN') {
                next()
            } else {
                res.status(403).send({ status: 'ERR', data: 'Usuario no admin' })
            }
        } else {
            res.status(401).send({ status: 'ERR', data: 'Usuario no autorizado' })
        }
    } catch (err) {
        res.status(500).send({ status: 'ERR', data: err.message })
    }
}

// Este endpoint es para testeo.
// Si es la primer visita desde esa instancia de navegador, req.session.visits no existirá,
// por ende se inicializará en 1 y se dará la bienvenida.
// En sucesivas visitas, ya estará disponible en req.session, por ende solo se lo incrementará.
// Continuará incrementando visita a visita hasta que caduque o se destruya la sesión.
router.get('/', async (req, res) => {
    try {
        // Verifico si hay al menos un usuario registrado
        const usuariosRegistrados = await User.find();

        if (usuariosRegistrados.length === 0) {
            // No hay usuarios registrados, redirige a la pagina de registro
            return res.redirect('/register');
        }

        // Si hay usuarios registrados renderiza login
        res.redirect('/login')
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: 'ERR', data: 'Error interno del servidor.' });
    }
});

router.get('/logout', async (req, res) => {
    try {
        // req.session.destroy nos permite destruir la sesión
        // De esta forma, en la próxima solicitud desde ese mismo navegador, se iniciará
        // desde cero, creando una nueva sesión y volviendo a almacenar los datos deseados.
        req.session.destroy((err) => {
            if (err) {
                res.status(500).send({ status: 'ERR', data: err.message })
            } else {
                // El endpoint puede retornar el mensaje de error, o directamente
                // redireccionar a login o una página general.
                // res.status(200).send({ status: 'OK', data: 'Sesión finalizada' })
                res.redirect('/login')
            }
        })
    } catch (err) {
        res.status(500).send({ status: 'ERR', data: err.message })
    }
})

// Este es un endpoint "privado", solo visible para admin.
// Podemos ver que el contenido no realiza ninguna verificación, ya que la misma se hace
// inyectando el middleware auth en la cadena (ver definición auth arriba).
// Si todo va bien en auth, se llamará a next() y se continuará hasta aquí, caso contrario
// la misma rutina en auth() cortará y retornará la respuesta con el error correspondiente.
router.get('/admin', auth, async (req, res) => {
    try {
        res.status(200).send({ status: 'OK', data: 'Estos son los datos privados' })
    } catch (err) {
        res.status(500).send({ status: 'ERR', data: err.message })
    }
})

// Nuestro primer endpoint de login!, básico por el momento, con algunas
// validacione "hardcodeadas", pero nos permite comenzar a entender los conceptos.
router.post('/login', async (req, res) => {
    try {
        const { mail, pass } = req.body

        // Busco al usuario en la base de datos por su correo
        const usuario = await User.findOne({ email: mail })

        if (usuario && usuario.password === pass) {
            // Autenticación exitosa, guardar información en la sesión
            req.session.user = {
                username: usuario.first_name,
                // Podemos darle un rol de USER o de ADMIN segun nos convenga.
                rol: 'USER'
            };

            // Redirecciono una vez que el usuario se identificó correctamente
            res.redirect('/products')
        } else {
            res.status(401).send({ status: 'ERR', data: 'Datos no válidos' })
        }
    } catch (err) {
        res.status(500).send({ status: 'ERR', data: err.message })
    }
})

router.post('/register', async (req, res) => {
    try {
        const { first_name, last_name, email, age, password } = req.body;

        // Verificamos si ya existe un usuario con el mismo correo
        const usuarioExistente = await User.findOne({ email });

        if (usuarioExistente) {
            return res.status(400).json({ status: 'ERR', data: 'El correo ya está registrado.' });
        }

        // Crear un nuevo usuario
        const newUser = new User({
            first_name,
            last_name,
            email,
            age,
            password, // No ciframos la contraseña solo por este caso, ya que el desafio no lo requiere.
        });

        // Guardamos el nuevo usuario en la base de datos
        await newUser.save();

        res.status(200).json({ status: 'OK', data: 'Usuario registrado exitosamente.' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ status: 'ERR', data: 'Error interno del servidor.' });
    }
});

export default router
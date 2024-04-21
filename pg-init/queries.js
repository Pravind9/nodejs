const { request, response } = require("express");

const Pool = require("pg").Pool
const pool = new Pool({
    user: "postgres",
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE,
    password: process.env.DATABASE_PASSWORD
});


pool.connect((error) => {
    if (error) {
        console.log(error);
    } else {
        console.log("Database Connected!");
    }
});


const getUsers = (request, response) => {
    console.log("inside get users");
    pool.query('SELECT oid, name, email, password FROM public.users ORDER BY oid ASC', (error, results) => {
        if (error) {
            console.log(error);
            throw error;
        }
        response.status(200).json(results.rows);
    });
}

const getUserById = (request, response) => {
    const oid = parseInt(request.params.oid);
    pool.query('SELECT oid, name, email, password FROM public.users WHERE oid = $1', [oid], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results.rows);
    });
}

const createUser = (request, response) => {
    const { name, email } = request.body;
    pool.query('INSERT INTO public.users (name, email) VALUES ($1, $2) RETURNING * ', [name, email], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(201).send(`User added with ID: ${results.rows[0].oid}`);
    })
}

const saveUser = (request, password) => {
    console.log("Request body = " + JSON.stringify(request.body) + " pass :: " + password);
    const { name, email } = request.body;

    pool.connect().then(client => {
        client.query('INSERT INTO public.users (name, email, password)  VALUES($1, $2, $3) RETURNING * ', [name, email, password], (error, results) => {
            if (error) {
                console.log(error);
                throw error;
            } else {
                console.log("user has been created" + results.rows[0].oid);
            }
        });
        console.log("Response is " + results.rows[0].oid);
    });
}

const updateUser = (request, response) => {
    const oid = parseInt(request.params.oid)
    console.log("Request body = " + JSON.stringify(request.body));
    const { name, email } = request.body

    pool.query(
        'UPDATE public.users SET name = $1, email = $2 WHERE oid = $3', [name, email, oid], (error, results) => {
            if (error) {
                throw error
            }
            response.status(200).send(`User modified with ID: ${oid}`)
        });
}


const deleteUser = (request, response) => {
    const oid = parseInt(request.params.oid)

    pool.query('DELETE FROM public.users WHERE oid = $1', [oid], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).send(`User deleted with ID: ${oid}`)
    })
}


module.exports = {
    getUsers,
    getUserById,
    createUser,
    saveUser,
    updateUser,
    deleteUser,
    pool
}
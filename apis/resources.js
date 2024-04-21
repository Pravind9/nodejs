const { request, response } = require("express");

const bcrypt = require("bcryptjs");
const pgdb = require("./../pg-init/queries");



const registerUser = (request, response) => {
    const { name, email, pass, cpass } = request.body;
    pgdb.pool.query('SELECT email FROM public.users WHERE email = $1', [email], async (error, results) => {
        if (error) {
            console.log(error);
            throw error;
        } else {
            if (results.rows.length > 0) {
                // First argument is view name and 2nd argument is error message.
                return response.render('registration',
                    { message: 'This email is already registered, please try with another email id.' });
            } else if (pass !== cpass) {
                return response.render('registration',
                    { message: 'Password and Confirm password did not match.' });
            }

            let hashedPassword = await bcrypt.hash(pass, 10);

            pgdb.pool.query('INSERT INTO public.users (name, email, password) VALUES($1, $2, $3) RETURNING * ', [name, email, hashedPassword], (err, result) => {
                if (error) {
                    console.log(error)
                } else {
                    return response.render('registration', {
                        message: `User registered! and user id is :: ${result.rows[0].oid}`
                    });
                }
            });
        }

    });

}

const authUser = (request, response) => {
    const { email, password } = request.body;
    pgdb.pool.query('SELECT email, password FROM public.users WHERE email = $1', [email], async (error, result) => {
        if (error) {
            console.log(error);
            throw error;
        } else {
            if (result.rows.length == 0) {
                // First argument is view name and 2nd argument is error message.
                return response.render('login',
                    { message: 'The user does not exist with this email id.' });
            } else if (result.rows.length > 1) {
                return response.render('login',
                    { message: 'There are multiple users associated with is email id' });
            } else if (result.rows.length == 1) {
                validateUser(result.rows[0].password, password, response);
            }
        }
    });
}

async function validateUser(hash, password, response) {
    console.log("stored hash = ", hash, " input password ", password);
    const match = await bcrypt.compare(password, hash);
    if (match) {
        return response.render('login',
            { message: 'You are Authorosed to access application!' });
    } else {
        return response.render('login',
            { message: 'You are NOT Authorosed to access application!' });
    }
}


const searchUser = (request, response) => {
    const { name, email } = request.body;

    if (!isEmpty(name) && !isEmpty(email)) {
        pgdb.pool.query('SELECT oid, name, email, password FROM public.users WHERE name = $1 AND email = $2', [name, email], async (error, results) => {
            if (error) {
                console.log(error);
                throw error;
            } else {
                if (results.rows.length == 0) {
                    // First argument is view name and 2nd argument is error message.
                    return response.render('userMgt',
                        { message: 'There is no any records found as per given criteria' });
                }
                console.log("Result is ", results.rows.length);
            }
        });
    } else if (!isEmpty(name)) {
        pgdb.pool.query('SELECT oid, name, email, password FROM public.users WHERE name = $1 ', [name], async (error, results) => {
            if (error) {
                console.log(error);
                throw error;
            } else {
                if (results.rows.length == 0) {
                    // First argument is view name and 2nd argument is error message.
                    return response.render('userMgt',
                        { message: 'There is no any records found as per given criteria' });
                }
                console.log("Result is ", results.rows.length);
            }
        });
    } else if (!isEmpty(email)) {
        pgdb.pool.query('SELECT oid, name, email, password FROM public.users WHERE email = $1', [email], async (error, results) => {
            if (error) {
                console.log(error);
                throw error;
            } else {
                if (results.rows.length == 0) {
                    // First argument is view name and 2nd argument is error message.
                    return response.render('userMgt',
                        { message: 'There is no any records found as per given criteria' });
                }
                console.log("Result is ", results.rows.length);
            }
        });
    } else if (isEmpty(name) && isEmpty(email)) {
        pgdb.pool.query('SELECT oid, name, email, password FROM public.users', async (error, results) => {
            if (error) {
                console.log(error);
                throw error;
            } else {
                if (results.rows.length == 0) {
                    // First argument is view name and 2nd argument is error message.
                    return response.render('userMgt',
                        { message: 'There is no any records found as per given criteria' });
                } else {
                    console.log("Result is ", results.rows.length);
                    return response.status(200).render("userMgt", { userList: results.rows });
                }


            }
        });
    }



}

const updateUser = (request, response) => {
    const { oid, name, email } = request.body;
    console.log("email ", email, " name ", name, " oid ", oid);

    if (!isEmpty(email)) {
        pgdb.pool.query('SELECT email FROM public.users WHERE oid = $1', [oid], async (error, result) => {
            if (error) {
                console.log(error);
                throw error;
            } else {
                if (result.rows.length == 0) {
                    // First argument is view name and 2nd argument is error message.
                    return response.render('userMgt',
                        { message: 'There is no any records found as per given criteria' });
                } else if (result.rows.length == 1) {
                    pgdb.pool.query(
                        'UPDATE public.users SET name = $1 WHERE email = $2 AND oid = $3', [name, email, oid], async (error, result) => {
                            if (error) {
                                throw error
                            }
                            console.log(`user update with ${oid}`);
                        });
                    pgdb.pool.query('SELECT oid, name, email FROM public.users WHERE oid = $1', [oid], async (error, result) => {
                        if (error) {
                            throw error
                        }
                        response.status(200).render("updateUser", {
                            user: result.rows[0],
                            message: `User Update with oid: ${oid}`
                        });
                    });
                }
            }
        });
    }

}

const deleteUser = (request, response) => {
    const oid = parseInt(request.params.oid);
    console.log("incoming oid = ", oid);

    if (!isEmpty(oid)) {
        pgdb.pool.query('DELETE FROM public.users WHERE oid = $1', [oid], async (error, results) => {
            if (error) {
                throw error
            }
            console.log(`User deleted with ID: ${oid}`);
        });

        pgdb.pool.query('SELECT oid, name, email, password FROM public.users', async (error, results) => {
            if (error) {
                console.log(error);
                throw error;
            } else {
                if (results.rows.length == 0) {
                    // First argument is view name and 2nd argument is error message.
                    return response.render('userMgt',
                        { message: 'There is no any records found as per given criteria' });
                } else {
                    console.log("Result is ", results.rows.length);
                    return response.status(200).render("userMgt",
                        { userList: results.rows, message: `User deleted with ID: ${oid}` });
                }

            }
        });
    }

}

const editUser = (request, response) => {
    const oid = parseInt(request.params.oid);
    console.log("incoming oid = ", oid);

    if (!isEmpty(oid)) {
        pgdb.pool.query('SELECT oid, name, email, password FROM public.users WHERE oid = $1', [oid], async (error, result) => {
            if (error) {
                throw error;
            }
            if (result.rows.length == 1) {
                return response.render('updateUser', {
                    user: result.rows[0]
                });
            }
        });
    }
}

function isEmpty(val) {
    return (val === undefined || val == null || val.length <= 0) ? true : false;
}

module.exports = {
    registerUser,
    authUser,
    searchUser,
    deleteUser,
    editUser,
    updateUser
}
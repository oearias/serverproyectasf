
const buildGetQuery = (table) => {

    let sql = `SELECT * `+
                `FROM `+
                `${table} `;

    return sql;
}

const buildGetQueryById = (table, id) => {

    let sql = `SELECT * `+
                `FROM `+
                `${table} WHERE id = ${id}`;

    return sql;
}

const buildDeleteQueryById = (table, id ) => {

    let sql = `DELETE `+
                `FROM `+
                `${table} WHERE id = ${id} RETURNING*;`;

    return sql;
}

const buildPostQuery = (table, data) => {
    
    if(Object.keys === 0)
        return null;

    let sql = `INSERT INTO ${table} (`;

    Object.entries(data).forEach(([key]) => {
        sql += `${key}, `;
        
    });

    sql = sql.slice(0, -2);
    sql += `) VALUES(`;
    
    Object.entries(data).forEach(([key, value]) => {
        const valueToSet = typeof data[key] === 'string' ? `'${value}'`: value;
        sql += `${valueToSet},`;
    });

    sql = sql.slice( 0, -1); //remove the last ","
    
    sql += `) RETURNING*; `

    return sql;
}

const buildPostQueryReturningId = (table, data) => {
    
    if(Object.keys === 0)
        return null;

    let sql = `INSERT INTO ${table} (`;

    Object.entries(data).forEach(([key]) => {
        sql += `${key}, `;
        
    });

    sql = sql.slice(0, -2);
    sql += `) VALUES(`;
    
    Object.entries(data).forEach(([key, value]) => {
        const valueToSet = typeof data[key] === 'string' ? `'${value}'`: value;
        sql += `${valueToSet},`;
    });

    sql = sql.slice( 0, -1); //remove the last ","
    
    sql += `) RETURNING *; `

    return sql;
}

const buildPatchQuery = (id, table, data) => {

    if(Object.keys === 0)
        return null;

    let sql = `UPDATE ${table} SET `;

    Object.entries(data).forEach(([key, value]) => {
        const valueToSet = typeof data[key] === 'string' ? `'${value}'`: value;
        sql += `${key} = ${valueToSet},`;
    });

    sql = sql.slice( 0, -1); //remove the last ","
    sql += ` WHERE id = ${id} RETURNING *;`

    return sql;
}

const buildGetQueryUserRole = (id, field) => {

    let sql = `SELECT `+
                `a.id,`+
                `b.nombre, b.apellido_paterno, b.apellido_materno, `+
                `c.nombre as role `+
                `FROM `+
                `dbo.user_role a, `+
                `dbo.usuarios b, `+
                `dbo.roles c `+
                `WHERE a.usuario_id = b. id `+
                `AND a.role_id = c.id `+
                `AND ${field} = ${id} order by b.id, c.id `;

    return sql;
}

const buildGetQueryUserGroup = (id, field) => {

    let sql = `SELECT `+
                `a.id,`+
                `b.nombre, b.apellido_paterno, b.apellido_materno, `+
                `c.nombre as role `+
                `FROM `+
                `dbo.user_group a, `+
                `dbo.usuarios b, `+
                `dbo.roles c `+
                `WHERE a.usuario_id = b. id `+
                `AND a.group_id = c.id `+
                `AND ${field} = ${id} order by c.nombre, b.id `;

    return sql;
}

const buildGetQueryGroupRole = (id, field) => {

    let sql = `SELECT `+
                `a.id,`+
                `b.nombre as group, `+
                `c.nombre as role `+
                `FROM `+
                `dbo.group_role a, `+
                `dbo.group b, `+
                `dbo.roles c `+
                `WHERE a.group_id = b. id `+
                `AND a.role_id = c.id `+
                `AND ${field} = ${id} order by b.nombre, c.nombre `;

    return sql;
}

module.exports = {
    buildGetQuery,
    buildGetQueryById,
    buildDeleteQueryById,
    buildPostQuery,
    buildPatchQuery,
    buildGetQueryUserRole,
    buildGetQueryUserGroup,
    buildGetQueryGroupRole,
    buildPostQueryReturningId
}
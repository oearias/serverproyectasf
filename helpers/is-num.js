const isNum = (val) => {

    return !isNaN(val);

} 

const numtoMayusString = (val) => {

    let a = val;

    if(!isNaN(val) === false){
        a = a.toUpperCase();
    }

    return a;

} 

module.exports = {
    isNum,
    numtoMayusString
};
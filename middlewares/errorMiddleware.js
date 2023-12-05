exports.errorMiddleware = async (err, req, res, next)=>{
    if (err) {
        return next(err)
    }
    return next(new ErrorHandler('Halaman tidak ditemukan.', 404));
}
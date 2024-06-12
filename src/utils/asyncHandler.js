const asyncHandler=()=>{
    (req,res,next)=>{
        Promise.resolve(req,res,next).
        catch((error) => next(error))
    }
}

export {asyncHandler}

// const asyncHandler = ()=>{}
// const asyncHandler = (func)=> ()=>{}
// const asyncHandler = (func)=> async()=>{}

    // const asyncHandler = (fun)=> async(req,res,next)=>{
    //     try {
    //         await fun(req,res,next)
    //     } catch (error) {
    //         res.status(error.code || 500).json({
    //             success:false,
    //             message:error.message
    //         })   
    //     }
    // }    
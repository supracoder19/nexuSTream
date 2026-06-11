import axios from "axios"
const gateway_api = import.meta.env.VITE_GATEWAY_URL || "http://localhost:8081/apiV2/" 
const core_api = import.meta.env.VITE_CORE_URL || "http://localhost:8081/apiV1/" 
import { toast } from "react-toastify"
const refresh =async (navigate,nextPath,errorPath="")=>{
    try {
        const res=await axios.get(core_api+"auth/refresh",{
            withCredentials:true
        })
        if(res.data.success)
        {
            if(nextPath!="")navigate(nextPath)
            return res.data.data
        }
        else{
            if(errorPath!="")navigate(errorPath)
        }
    } catch (error) {
        console.log(error);
    }
}
const login =async (navigate,username,password)=>{
    try {
        let res= await axios.post(core_api+"auth/login",
            {username,password},
            {
                withCredentials:true
            }
        )
        // let res=await axios.get(core_api+"health-check")
        if(res.data.success)
        {
            navigate("/home")
        }
        else{
             throw new Error(res.data.msg)
        }
    } catch (error) {
        toast.error(error.message);
    }
}

const register =async (navigate,username,password,email)=>{
    try {
        let res= await axios.post(core_api+"auth/register",
            {username,password,email},{
                withCredentials:false
            }
        )
        // let res=await axios.get(core_api+"health-check")
        if(res.data.success)
        {
            navigate("/login")
        }
        else{
            throw new Error(res.data.msg)
        }
    } catch (error) {
        console.log(error);
    }
}
const logout =async (navigate)=>{
    try {
        let res= await axios.get(core_api+"auth/logout",
            {
                withCredentials:false
            }
        )
    } catch (error) {
        console.log(error);
    }
    finally
    {
        navigate("/")
    }
}
const updateUser =async (details={})=>{
    try {
        const res = await axios.post(`${core_api}auth/updateUser`,details,{
            withCredentials:true
        })
        if(res.data.success)
        {
            return
        }
        else{
            throw new error(res.data.msg)
        }
    } catch (error) {
        console.log(error);
        
    }
   
}
export {refresh,login,register,logout,updateUser}
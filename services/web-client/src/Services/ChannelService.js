import axios from "axios"

const gateway_api = import.meta.env.VITE_GATEWAY_URL || "http://localhost:8081/apiV2/" 
const core_api = import.meta.env.VITE_CORE_URL || "http://localhost:8081/apiV1/"
const search = async (query,setFilteredChannels) =>{
    try {
        const res=await axios.get(`${core_api}channel/search?query=${query}`,{
            withCredentials:true
        })
        if(res.data.success)
        {
            setFilteredChannels(res.data.data)
        }
        else throw new Error(res.data.msg)
        
    } catch (error) {
        console.log(error)
    }
}

const channelDetails = async (req,setChannel) =>{
    try {
        
        const res=await axios.post(`${core_api}channel`,req,{
            withCredentials:true
        })
        
        if(res.data.success)
        {
            setChannel(res.data.data[0])
            
        }
        else throw new Error(res.data.msg)
        
    } catch (error) {
        console.log(error)
    }
}


const subscribeChannel = async (channelId) =>{
    try {
        
        const res=await axios.get(core_api+"channel/subscribe/"+channelId,{
            withCredentials:true
        })
        
        if(res.data.success)
        {
            return true;
            
        }
        else throw new Error(res.data.msg)
        
    } catch (error) {
        console.log(error)
    }
    return false
} 
const unsubscribeChannel = async (channelId) =>{
    try {
        
        const res=await axios.get(core_api+"channel/unsubscribe/"+channelId,{
            withCredentials:true
        })
        
        if(res.data.success)
        {
            return false;
            
        }
        else throw new Error(res.data.msg)
        
    } catch (error) {
        console.log(error)
    }
    return true
} 

export {search,channelDetails,subscribeChannel,unsubscribeChannel}
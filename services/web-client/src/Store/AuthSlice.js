import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userName: "",
  channelName:"",
  subscriber:0,
  channelDesc:"",
  videoCount:0,
  userId:""
};

export const userSlice = createSlice({
  name: 'userSlice',
  initialState,
  reducers: {
    editUser : (state,action) =>{
      return{
        ...state,
      ...action.payload
      }
    }
    }
  });

// Export the generated actions to use in components
export const { editUser } = userSlice.actions;

// Export the reducer to plug into the store
export default userSlice.reducer;
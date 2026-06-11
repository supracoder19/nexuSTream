package com.nexuSTream.core_service.Service;

import com.nexuSTream.core_service.DTO.ResponseObject;
import com.nexuSTream.core_service.Models.Channel;
import com.nexuSTream.core_service.Models.User;
import com.nexuSTream.core_service.Repository.ChannelRepo;
import com.nexuSTream.core_service.Repository.SubRepo;
import com.nexuSTream.core_service.Repository.UserRepo;
import com.nexuSTream.core_service.utils.JwtUtils; // Your JWT Utility class

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {


    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private CustomUserDetailsService usd;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepo urepo;

    @Autowired
    private ChannelRepo crepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RedisCache red;

    @Autowired
    private SubRepo srepo;
    public String viewerCountIncrease()
    {
        try {
            String data=red.getData("view-count");
            int cnt=data==null?0:Integer.parseInt(red.getData("view-count"));
            red.saveData("view-count", String.valueOf(cnt+1));
            return String.valueOf(cnt+1);
        } catch (Exception e) {
            return e.getMessage();
        }
        
    }

    public ResponseObject<Map<String, String>> loginService(String username, String password) {
        ResponseObject<Map<String, String>> res = new ResponseObject<>();
        try {
            // 1. Hand off credentials to Spring's AuthenticationManager
            // Under the hood, this calls your CustomUserDetailsService,
            // loads the user, and matches the BCrypt password hashes.
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));

            // 2. If authentication is successful, fetch the UserDetails
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // 3. Generate a fresh JWT string for this user
            String accessToken = jwtUtils.generateAccessToken(userDetails);
            String refreshToken = jwtUtils.generateRefreshToken(userDetails);

            Map<String, String> mp = new HashMap<>();
            mp.put("accessToken", accessToken);
            mp.put("refreshToken", refreshToken);
            red.saveData(username, refreshToken);
            res.setMsg("successfully loggedin");
            res.setData(List.of(mp));
            // 4. Return success response holding the token payload
        } catch (Exception e) {
            // If bad credentials, account locked, etc., an exception is thrown
            res.setSuccess(false);
            res.setMsg(e.getMessage());
        }
        return res;
    }

    public ResponseObject<String> registerService(String username, String password, String email) {
        try {
            // 1. Check if username is already registered
            if (urepo.existsByUsername(username)) {
                throw new Exception("Username not available");
            }
            if (urepo.existsByEmail(email)) {
                throw new Exception("Email already associated with an account");
            }

            // 2. Create a new instance of your custom User entity
            User newUser = new User();
            newUser.setUsername(username);
            newUser.setEmail(email);
            // 3. CRITICAL: Hash the password using BCrypt before saving
            String hashedPassword = passwordEncoder.encode(password);
            newUser.setPassword(hashedPassword);

            // 5. Save the entity to the database
            urepo.save(newUser);
            Channel channel = new Channel();
            channel.setChannelName(username);
            channel.setDescription("Streaming the future!!!!");
            channel.setOwner(newUser);

            crepo.save(channel);

            return new ResponseObject<>("User registered successfully!", true, null);

        } catch (Exception e) {
            // If bad credentials, account locked, etc., an exception is thrown
            return new ResponseObject<>(e.getMessage(), false, null);
        }
    }

    public ResponseObject<HashMap<String, String>> refreshService(String refreshToken) {
        ResponseObject<HashMap<String, String>> ob = new ResponseObject<>();
        try {
            User user = urepo.findByUsername(String.valueOf(jwtUtils.extractUsername(refreshToken))).orElse(null);
            // System.out.println(jwtUtils.extractUsername(refreshToken)+" "+refreshToken+" "+user);
            if (user != null) {
                String redtoken = red.getData(user.getUsername());
                if(redtoken==null || !redtoken.equals(refreshToken)) throw new Exception("User Data mismatch");
                ob.setSuccess(true);
                ob.setMsg("User authorized");
                HashMap<String, String> resData = new HashMap<>();
                resData.put("accessToken", jwtUtils.generateAccessToken(user));
                resData.put("userName", user.getUsername());
                resData.put("email", user.getEmail()); 
                resData.put("userId", String.valueOf(user.getId()));

                Channel channel = user.getChannel();

                if(channel !=null)
                {resData.put("channelName", channel.getChannelName());
                resData.put("channelDesc", channel.getDescription());
                resData.put("subscriberCount", String.valueOf(srepo.countByChannelId(channel.getId())));
                }

                ob.setData(List.of(resData));
                return ob;
            } else {
                throw new Exception("User unauthorized");
            }
        } catch (Exception e) {
            ob.setMsg(e.getMessage());
            ob.setSuccess(false);
            return ob;
        }
    }
    public ResponseObject<?> updateUser(Map<String,String> req)
    {
        ResponseObject<String> res= new ResponseObject<>();
        try {
            Authentication auth=authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(getUserName(), req.get("oldPassword")));
            User user=(User) auth.getPrincipal();
            if(req.get("channelName")!=null)
            {
                user.getChannel().setChannelName(req.get("channelName"));
            }
            if(req.get("channelDesc")!=null)
            {
                user.getChannel().setDescription(req.get("channelDesc"));
            }
            if(req.get("email")!=null)
            {
                user.setEmail(req.get("email"));
            }
            if(req.get("newPassword")!=null)
            {
                user.setPassword(passwordEncoder.encode(req.get("newPassword")));
            }
            urepo.save(user);
            res.setMsg("successfully Updated");
        } catch (Exception e) {
           res.setMsg(e.getMessage());
           res.setSuccess(false);
        }
        return res;
    }

    public ResponseObject<String> logoutService(String refreshToken) {
        ResponseObject<String> ob = new ResponseObject<>();
        try {
            UserDetails user = usd.loadUserByUsername(jwtUtils.extractUsername(refreshToken));
            if (user.getUsername() != null) {
                ob.setSuccess(true);
                ob.setMsg("User Loggedout");
                red.deleteData(user.getUsername());
                return ob;
            } else {
                throw new Exception("User Not found");
            }
        } catch (Exception e) {
            ob.setMsg(e.getMessage());
            ob.setSuccess(false);
            return ob;
        }
    }
    public String getUserName()
    {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            String username;
            
            if (principal instanceof UserDetails) {
                username = ((UserDetails) principal).getUsername();
            } else {
                username = principal.toString(); // Fallback if the principal is a raw string
            }
            return username;
    }
}
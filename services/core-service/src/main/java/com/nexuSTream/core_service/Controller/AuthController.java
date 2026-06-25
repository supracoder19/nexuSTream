package com.nexuSTream.core_service.Controller;


import java.util.HashMap;
import java.util.Map;


import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nexuSTream.core_service.DTO.LoginObject;
import com.nexuSTream.core_service.DTO.RegistrationObject;
import com.nexuSTream.core_service.DTO.ResponseObject;
import com.nexuSTream.core_service.Service.AuthService;

import lombok.AllArgsConstructor;




@RestController
@RequestMapping("/auth")
@AllArgsConstructor
public class AuthController {
    private AuthService auth;
    @GetMapping("/viewCount")
    public String viewerCountIncrease() {
        return auth.viewerCountIncrease();
    }
    
    @PostMapping("/login")
    public ResponseEntity<ResponseObject<?>> login(@RequestBody LoginObject request) {
        ResponseObject<Map<String,String>> ob= auth.loginService(request.getUsername(), request.getPassword());
        if(!ob.getSuccess()) 
        return ResponseEntity.ok(ob);
        // 2. Build the HttpOnly cookie
        
        ResponseCookie cookie = ResponseCookie.from("refreshToken", ob.getData().get(0).get("refreshToken").trim())
                .httpOnly(true)                    // Prevents JavaScript access (XSS protection)
                // .secure(true)                      // Forces HTTPS connection
                .path("/")                         // Accessible across the entire app domain
                .maxAge(7 * 24 * 60 * 60)          // Expiration in seconds (e.g., 7 days)
                .sameSite("none")                 
                .build();

        ResponseCookie accCookie = ResponseCookie.from("accessToken",ob.getData().get(0).get("accessToken").trim())
                .httpOnly(true)                    // Prevents JavaScript access (XSS protection)
                // .secure(true)                      // Forces HTTPS connection
                .path("/")                         // Accessible across the entire app domain
                .maxAge(15 * 60)          // Expiration in seconds (e.g., 15min)
                .sameSite("none")                   
                .build();
        ob.setData(null);
        // 3. Add the cookie to the response headers
        return ResponseEntity.ok()
                 .headers(headers -> {
        headers.add("Set-Cookie", cookie.toString());
        headers.add("Set-Cookie", accCookie.toString());
    })
                .body(ob);
    }
    @PostMapping("/register")
    public ResponseEntity<ResponseObject<?>> register(@RequestBody RegistrationObject request) {
        System.out.println(request);
        ResponseObject<String> ob=auth.registerService(request.getUsername(), request.getPassword(),request.getEmail());
        return ResponseEntity.ok(ob);
    }
    @GetMapping("/refresh")
    public ResponseEntity<ResponseObject<?>> refresh(@CookieValue(name ="refreshToken", required = false) String refreshToken,@CookieValue(name ="accessToken", required = false) String accessToken) {
        ResponseObject<HashMap<String,String>> res=auth.refreshService(refreshToken,accessToken);
        if(res.getSuccess())
        {
            ResponseCookie accCookie = ResponseCookie.from("accessToken",res.getData().get(0).get("accessToken"))
                .httpOnly(true)                    // Prevents JavaScript access (XSS protection)
                // .secure(true)                      // Forces HTTPS connection
                .path("/")                         // Accessible across the entire app domain
                .maxAge(15 * 60 )          // Expiration in seconds (e.g., 7 days)
                .sameSite("none")               
                .build();
            res.getData().get(0).remove("accessToken");
            return ResponseEntity.ok()
                .header("Set-Cookie", accCookie.toString())
                .body(res);
        }
        else{
            return ResponseEntity.ok(res);
    }
    }
    @GetMapping("/logout")
    public ResponseEntity<ResponseObject<?>> logout(@CookieValue(name = "refreshToken", required = true) String refreshToken) {
        // System.out.println(refreshToken);
        ResponseObject<String> res=auth.logoutService(refreshToken);
        return ResponseEntity.ok(res);
    }
    @PostMapping("/updateUser")
    public ResponseEntity<?> updateUser(@RequestBody Map<String,String> req) {
        
        
        return ResponseEntity.ok(auth.updateUser(req));
    }
    
    
}

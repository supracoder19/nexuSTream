package com.nexuSTream.core_service.Configuration;

import java.io.IOException;
import java.util.Arrays;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.nexuSTream.core_service.Service.CustomUserDetailsService;
import com.nexuSTream.core_service.utils.JwtUtils;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils; // Your custom class to validate & extract claims

    @Autowired
    private CustomUserDetailsService userDetailsService;

    // 1. Skip token validation entirely for these endpoints
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        return path.equals("/auth/login") || 
               path.equals("/auth/refresh") || 
               path.equals("/auth/register")||
               path.equals("/auth/viewCount");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        // String authHeader = request.getHeader("Authorization");
        // String refreshCookie = request.getCookies().toString();
        Cookie[] cookies=request.getCookies();
        String authHeader = Arrays.stream(cookies != null ? cookies : new Cookie[0])
        .filter(c -> "Authorization".equals(c.getName()))
        .map(Cookie::getValue)
        .findFirst()
        .orElse(null); // Returns null if the cookie isn't found
        if (authHeader != null && authHeader.startsWith("Bearer")) {
            String jwt = authHeader.substring(6);
            String username = jwtUtils.extractUsername(jwt);
            // If we have a username and the user isn't authenticated yet in this request loop
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                
                if (jwtUtils.isTokenValid(jwt, userDetails)) {
                    // Create an authentication token object
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    
                    // Put it in the context! Now .authenticated() will pass this request
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        }
        
        // Pass the request along to the next filter in the chain
        filterChain.doFilter(request, response);
    }
}
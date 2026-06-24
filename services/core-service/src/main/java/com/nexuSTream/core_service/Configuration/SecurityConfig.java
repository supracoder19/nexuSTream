package com.nexuSTream.core_service.Configuration;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import lombok.RequiredArgsConstructor;


@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtAuthFilter jwtAuthFilter;
    @Value("${ALLOWED_ORIGIN}")
    private String allowedOrigin; 
   @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF since we are stateless and using JWTs
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(request -> {
            CorsConfiguration config = new CorsConfiguration();
            // Since you are using an Nginx proxy on localhost, allow everything from localhost
            config.setAllowedOriginPatterns(List.of(allowedOrigin));
            config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
            config.setAllowedHeaders(List.of("*"));
            config.setExposedHeaders(List.of("Set-Cookie")); // Crucial for HttpOnly cookie tracking
            config.setAllowCredentials(true); 
            return config;
        }))
            // Explicitly disable the default HTML login form
            .formLogin(form -> form.disable())
            
            // Set session management to STATELESS (No HttpSessions created)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // Configure route authorization rules
            .authorizeHttpRequests(auth -> auth
                // Anyone can access auth endpoints and the health check
                .requestMatchers("/auth/**", "/health-check","/event/**").permitAll()
                // .anyRequest().permitAll()
                // Every other single route requires a valid authentication state
                .anyRequest().authenticated()
            );
        
        // Add your custom JWT validation filter right before the username/password checkpoint
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    // .cors(cors -> cors.configurationSource(request -> {
    //         CorsConfiguration config = new CorsConfiguration();
    //         // Since you are using an Nginx proxy on localhost, allow everything from localhost
    //         config.setAllowedOriginPatterns(List.of("http://localhost*", "http://127.0.0.1*"));
    //         config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    //         config.setAllowedHeaders(List.of("*"));
    //         config.setExposedHeaders(List.of("Set-Cookie")); // Crucial for HttpOnly cookie tracking
    //         config.setAllowCredentials(true); 
    //         return config;
    //     }))


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 2. AuthenticationManager Bean (Handles checking credentials during /login)
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
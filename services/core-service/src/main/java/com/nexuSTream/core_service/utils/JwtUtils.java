package com.nexuSTream.core_service.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import com.nexuSTream.core_service.Models.User;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtils {

    // Must be a Base64-encoded string containing at least 256 bits (32 bytes) of
    // data
    @Value("${JWT_KEY}")
    private String SECRET_KEY;

    // private final long EXPIRATION_TIME = 1000 * 60 * 60 * 24 ;

    // 1. Generate Token for User
    public String generateAccessToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        // if (userDetails instanceof User) {
        //     claims.put("userId", ((User) userDetails).getId());
        // }
        claims.put("userId", ((User) userDetails).getId());
        // System.out.println(((User) userDetails).getId()+" hrpok"+claims.get("userId"));
        return createToken(claims, userDetails.getUsername(), System.currentTimeMillis() + 1000 * 60 * 15);
    }

    public String generateAccessToken(UserDetails userDetails,long min) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", ((User) userDetails).getId());
        return createToken(claims, userDetails.getUsername(), System.currentTimeMillis() + 1000 * 60 * min);
    }

    public String generateRefreshToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        if (userDetails instanceof User) {
            claims.put("userId", ((User) userDetails).getId());
        }
        return createToken(claims, userDetails.getUsername(), System.currentTimeMillis() + 1000 * 60 * 60 * 24 * 7);
    }

    private String createToken(Map<String, Object> claims, String subject, long time) {
       return Jwts.builder()
            .claims(claims) // <-- FIX 1: This injects your userId into the payload
            .subject(subject)
            .issuedAt(new Date())
            .expiration(new Date(time)) // <-- FIX 2: Uses the clean expiration date directly
            .signWith(getSigningKey())
            .compact();
}

    // 2. Validate Token
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    // 3. Extract Username from Token
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // 3. Extract Username from Token
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // 4. Check if Token is Expired
    public boolean isTokenExpired(String token) {
        try {
            // Correct syntax: Type in angled brackets, matching .class in arguments, "exp"
            // as key
            return this.<Date>extractField(token, "exp", Date.class).before(new Date());
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            return true; // Catching the runtime exception explained previously
        }
    }

    public <T> T extractField(String token, String field, Class<T> requiredType) {
        return extractClaim(token, claims -> claims.get(field, requiredType));
    }

    // // Usage examples:
    // String email = jwtUtils.extractField(token, "email", String.class);
    // Long userId = jwtUtils.extractField(token, "userId", Long.class);
    // Date issuedAt = jwtUtils.extractField(token, "iat", Date.class);
    // Generic helper to extract individual claims
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Parse the token using the signing key
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey()) // Modern way to set the signing key for validation
                .build()
                .parseSignedClaims(token) // Modern replacement for parseClaimsJws
                .getPayload(); // Modern replacement for getBody()
    }

    // Decode the base64 secret string to generate the HMAC-SHA signing key
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
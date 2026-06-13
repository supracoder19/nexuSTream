package com.nexuSTream.core_service.Service;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.nexuSTream.core_service.Models.User;
import com.nexuSTream.core_service.Repository.UserRepo;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class CustomUserDetailsService implements UserDetailsService
{
    private UserRepo urepo;
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException
    {
        User user=urepo.findByUsername(username).orElseThrow(()->new UsernameNotFoundException("User not found with username: " + username));
        return user;
    }
}
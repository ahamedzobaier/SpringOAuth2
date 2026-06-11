package com.zobaier.SpringOAuth2;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Map;
import java.util.HashMap;
import java.util.Collection;

@RestController
public class HelloController {

    @Autowired
    private UserProfileRepository repository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    @GetMapping("/user")
    public ResponseEntity<Map<String, Object>> user(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        
        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            response.put("authenticated", false);
            return ResponseEntity.ok(response);
        }

        response.put("authenticated", true);
        
        if (authentication.getPrincipal() instanceof OAuth2User) {
            OAuth2User principal = (OAuth2User) authentication.getPrincipal();
            
            // Extract provider and provider ID
            String sub = principal.getAttribute("sub");
            String provider = "google";
            String idStr = sub;
            if (sub == null) {
                Object gitId = principal.getAttribute("id");
                idStr = gitId != null ? gitId.toString() : null;
                provider = "github";
            }

            if (idStr == null) {
                idStr = "unknown_user";
            }

            String registryKey = provider + "_" + idStr;

            // Tries "name" (Google) first, then "login" (GitHub)
            String name = principal.getAttribute("name");
            if (name == null) {
                name = principal.getAttribute("login");
            }
            if (name == null) name = "Unknown User";

            String email = principal.getAttribute("email");
            if (email == null) email = "";

            // Try to get avatar URL (avatar_url for GitHub, picture for Google)
            String avatarUrl = principal.getAttribute("avatar_url");
            if (avatarUrl == null) {
                avatarUrl = principal.getAttribute("picture");
            }
            if (avatarUrl == null) avatarUrl = "";

            // Load user from repository
            UserProfile profile = repository.findById(registryKey).orElse(null);
            
            response.put("name", name);
            response.put("email", email);
            response.put("avatarUrl", avatarUrl);
            response.put("provider", provider);
            response.put("attributes", principal.getAttributes());

            if (profile == null) {
                // Not registered in DB yet!
                response.put("profileComplete", false);
                response.put("profile", null);
            } else {
                // Keep attributes fresh in DB
                if (name != null && !name.trim().isEmpty()) {
                    profile.setName(name);
                }
                if (email != null && !email.trim().isEmpty()) {
                    profile.setEmail(email);
                }
                if (avatarUrl != null && !avatarUrl.trim().isEmpty()) {
                    profile.setAvatarUrl(avatarUrl);
                }
                repository.save(profile);

                response.put("profileComplete", true);
                response.put("profile", profile);
            }
        } else {
            // Local Login session (fallback / testing)
            String email = authentication.getName();
            String registryKey = "local_" + email;
            UserProfile profile = repository.findById(registryKey).orElse(null);
            if (profile != null) {
                response.put("profileComplete", true);
                response.put("profile", profile);
                response.put("name", profile.getName());
                response.put("email", profile.getEmail());
                response.put("avatarUrl", profile.getAvatarUrl());
                response.put("provider", profile.getProvider());
                response.put("attributes", Map.of(
                    "email", profile.getEmail(),
                    "name", profile.getName(),
                    "provider", profile.getProvider()
                ));
            } else {
                response.put("authenticated", false);
                return ResponseEntity.ok(response);
            }
        }

        // Include security roles (authorities)
        response.put("authorities", authentication.getAuthorities().stream()
            .map(auth -> auth.getAuthority())
            .toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/auth/register-oauth-profile")
    public ResponseEntity<Map<String, Object>> registerOauthProfile(Authentication authentication, @RequestBody Map<String, String> body) {
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof OAuth2User)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized: OAuth2 authentication required"));
        }

        OAuth2User principal = (OAuth2User) authentication.getPrincipal();
        String sub = principal.getAttribute("sub");
        String provider = "google";
        String idStr = sub;
        if (sub == null) {
            Object gitId = principal.getAttribute("id");
            idStr = gitId != null ? gitId.toString() : null;
            provider = "github";
        }

        if (idStr == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid OAuth2 context"));
        }

        String registryKey = provider + "_" + idStr;
        if (repository.existsById(registryKey)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Profile already registered"));
        }

        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        String location = body.get("location");
        String address = body.get("address");
        String contactInfo = body.get("contactInfo");

        if (name == null || name.trim().isEmpty() || email == null || email.trim().isEmpty() || 
            password == null || password.trim().isEmpty() || 
            address == null || address.trim().isEmpty() || 
            contactInfo == null || contactInfo.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Full Name, Email, Password, Address, and Contact Info are all required to create your account"));
        }

        // Get avatar URL from principal
        String avatarUrl = principal.getAttribute("avatar_url");
        if (avatarUrl == null) {
            avatarUrl = principal.getAttribute("picture");
        }
        if (avatarUrl == null) avatarUrl = "";

        UserProfile profile = new UserProfile(registryKey, name, email, avatarUrl, provider);
        profile.setPassword(passwordEncoder.encode(password));
        profile.setLocation(location != null && !location.trim().isEmpty() ? location : "Not specified");
        profile.setAddress(address);
        profile.setContactInfo(contactInfo);
        profile.setProfileComplete(true);
        repository.save(profile);

        Map<String, Object> res = new HashMap<>();
        res.put("profile", profile);
        res.put("success", true);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/api/users")
    public ResponseEntity<Collection<UserProfile>> getAllUsers() {
        return ResponseEntity.ok(repository.findAll());
    }

    @PostMapping("/api/users/profile")
    public ResponseEntity<UserProfile> updateProfile(Authentication authentication, @RequestBody Map<String, String> body) {
        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(401).build();
        }

        String email = authentication.getName();
        if (authentication.getPrincipal() instanceof OAuth2User oauthUser) {
            String sub = oauthUser.getAttribute("sub");
            String provider = "google";
            String idStr = sub;
            if (sub == null) {
                Object gitId = oauthUser.getAttribute("id");
                idStr = gitId != null ? gitId.toString() : null;
                provider = "github";
            }
            if (idStr != null) {
                email = provider + "_" + idStr;
            }
        } else {
            email = "local_" + email;
        }

        UserProfile profile = repository.findById(email).orElse(null);
        
        if (profile != null) {
            if (body.containsKey("location")) profile.setLocation(body.get("location"));
            if (body.containsKey("address")) profile.setAddress(body.get("address"));
            if (body.containsKey("contactInfo")) profile.setContactInfo(body.get("contactInfo"));
            repository.save(profile);
        }

        return ResponseEntity.ok(profile);
    }

    @PostMapping("/api/users/delete")
    public ResponseEntity<Map<String, Object>> deleteAccount(Authentication authentication, HttpServletRequest request, HttpServletResponse response) {
        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String registryKey = null;
        if (authentication.getPrincipal() instanceof OAuth2User oauthUser) {
            String sub = oauthUser.getAttribute("sub");
            String provider = "google";
            String idStr = sub;
            if (sub == null) {
                Object gitId = oauthUser.getAttribute("id");
                idStr = gitId != null ? gitId.toString() : null;
                provider = "github";
            }
            if (idStr != null) {
                registryKey = provider + "_" + idStr;
            }
        } else {
            registryKey = "local_" + authentication.getName();
        }

        if (registryKey != null) {
            UserProfile profile = repository.findById(registryKey).orElse(null);
            if (profile != null) {
                repository.delete(profile);
            }
        }

        // Programmatically clear context and invalidate session
        SecurityContextHolder.clearContext();
        jakarta.servlet.http.HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Account deleted successfully"));
    }

    @GetMapping("/secured")
    public String secured() {
        return "You have successfully authenticated and accessed the secured endpoint!";
    }
}

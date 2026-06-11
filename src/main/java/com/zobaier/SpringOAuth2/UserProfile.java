package com.zobaier.SpringOAuth2;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_profiles")
public class UserProfile {
    
    @Id
    private String id; // format: "provider_providerId" e.g., "google_123456"
    
    private String name;
    private String email;
    private String avatarUrl;
    private String provider;
    private String location;
    private String address;
    private String contactInfo;
    private String password;
    private boolean profileComplete;

    public UserProfile() {}

    public UserProfile(String id, String name, String email, String avatarUrl, String provider) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.avatarUrl = avatarUrl;
        this.provider = provider;
        this.location = "Not specified";
        this.address = "Not specified";
        this.contactInfo = "Not specified";
        this.profileComplete = true;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getContactInfo() { return contactInfo; }
    public void setContactInfo(String contactInfo) { this.contactInfo = contactInfo; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public boolean isProfileComplete() { return profileComplete; }
    public void setProfileComplete(boolean profileComplete) { this.profileComplete = profileComplete; }
}

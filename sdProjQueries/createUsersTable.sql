CREATE TABLE Users(
    user_uid NVARCHAR(256) PRIMARY KEY,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Facility Staff', 'Resident')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('Active', 'Pending', 'Blocked')),
    date_created DATETIME DEFAULT GETDATE()
);
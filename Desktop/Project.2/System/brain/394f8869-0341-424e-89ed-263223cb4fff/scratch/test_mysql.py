import mysql.connector

passwords = ["", "root", "password", "admin", "root123", "mysql", "123456", "1234", "root@123", "Root@123"]

for pwd in passwords:
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password=pwd
        )
        print(f"SUCCESS: password='{pwd}' works!")
        conn.close()
        break
    except mysql.connector.Error as err:
        print(f"FAILED: password='{pwd}' -> {err}")

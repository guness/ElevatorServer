module.exports = {
    apps: [
        {
            name: "Elevator",
            script: "./app.js",
            env: {
                "PORT": 8080,
                "NODE_ENV": "development"
            },
            env_production: {
                "PORT": 80,
                "NODE_ENV": "production",
            }
        }
    ]
};

using StackExchange.Redis;
using System.Runtime.CompilerServices;

public static class Application
{
    public static ConnectionMultiplexer redis;
    public static IDatabase RedisDB => redis.GetDatabase();


    static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        redis = ConnectionMultiplexer.Connect(
            new ConfigurationOptions
            {
                EndPoints = { "127.0.0.1:6379" }
            });
        // Add services to the container.

        builder.Services.AddControllers();
        // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        var app = builder.Build();

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseAuthorization();

        app.MapControllers();

        app.Run();
    }
}
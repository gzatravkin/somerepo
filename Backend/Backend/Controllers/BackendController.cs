using Microsoft.AspNetCore.Mvc;
using ServiceStack;
using ServiceStack.Text;
using StackExchange.Redis;
using System;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace Backend.Controllers
{
    [ApiController]
    [Microsoft.AspNetCore.Mvc.Route("[controller]")]
    public class BackendController : ControllerBase
    {
        private readonly ILogger<BackendController> _logger;
        string adminToken = "CKLZXMCLKASioEQWMNKLDSACNSE";
        public BackendController(ILogger<BackendController> logger)
        {
            _logger = logger;
        }

        [HttpGet("attempts")]
        public int CountOfAttempts(string dni)
        {
            var data = Application.RedisDB.StringGet("Attempts" + dni);
            if (data.IsNull)
            {
                Application.RedisDB.StringSet("Attempts" + dni, "0");
                return 0;
            }
            return Convert.ToInt32(data);
        }

        [HttpGet("appoitment")]
        public DateTime RandomDate()
        {
            return DateTime.Now.AddDays(Random.Shared.Next(1, 7)); //move to separate service? solo si tenes tiempo
        }

        [HttpPost("password")]
        public string GenerateUniquePassword(string dni)
        {
            int attempts = CountOfAttempts(dni);
            attempts++;
            Application.RedisDB.StringSet("Attempts" + dni, attempts.ToString());
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var s = new string(Enumerable.Repeat(chars, 10)
                .Select(s => s[Random.Shared.Next(s.Length)]).ToArray());
            Application.RedisDB.StringSet("Passwords"+s, s, TimeSpan.FromHours(1));
            return s;
        }

        [HttpGet("stats")]
        public string Stats(string token)
        {
            if (token != adminToken)
                return "Token no matchea";
            return "{Stats: \"" + Application.RedisDB.StringGet("Stats") +"\"" ;
        }

        [HttpPost("questions")]
        public List<Question> ExamenQuestions(string password) //make check that password is valid against db
        {
            var passCheck = !Application.RedisDB.StringGet("Passwords"+password).IsNull;
            Application.RedisDB.StringSet("Passwords"+password, RedisValue.Null);

            if (!passCheck)
                return new List<Question>();
            var data = Application.RedisDB.StringGet("que");
            return JsonSerializer.DeserializeFromString<List<Question>>(data);
        }

        [HttpPost("answers")]
        public bool ValidateAnswers(List<string> answers)
        {
            int fails = 0;
            Application.RedisDB.SetAdd("ans", "o4");
            foreach (var answer in answers)
                if (!Application.RedisDB.SetContains("ans", answer))
                    fails++;

            if (fails > 2)
                return false;
            return true;
        }
    }
}
using InterLayer.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using System.Diagnostics;
using System.Net.Http.Json;
using System.Net.Http;
/*
• Implementar un modelo cliente servidor.
• Implementar modelo API, desacoplar completamente el frontend del backend.
• Implementar el paradigma de objetos.
• Implementar al menos en la relación entre dos objetos inyección de dependencias.
Objetivo del primer entregable: se pide documentar el plan de trabajo y las decisiones técnicas
tomadas para la resolución del mismo. Se deberán entregar diagramas y justificaciones. NO se
requiere la entrega de código en la primera instancia.


Objetivo: realizar el control de turnos y otorgamiento de licencias de conducir, tomando en
consideración los siguientes requerimientos funcionales. - El examen consta de dos etapas. La primer
etapa incluye la pregunta si utiliza o no anteojos. Si responde que no automáticamente deberá
generarse el examen y permitirle responder el cuestionario. Si responde que si, se generará un turno
random para que asista a una revisión. (La fecha deberá generarse de manera aleatoria). - El usuario
debería generar una clave para poder acceder al examen, la cual tendrá un tiempo de expiración de
una hora. - El cuestionario constará de 10 preguntas precargas de opción múltiple. Las mismas
deberás cargarse de forma aleatoria. - La clave generada podrá utilizarse una sola vez. En caso que
no termine la evaluación no podrá volver a usarla. - Aprueba el examen con un 8 preguntas
respondidas correctamente. - En caso de reprobar el sistema deberá generar un nuevo turno aleatorio.
- La misma persona sólo podrá rendir un máximo de 3 veces el examen. - Los resultados del examen
deberán guardarse durante 1 semana. - Las preguntas deberán poder ser editables por un administrador
del sistema. - El administrador del sistema podrá acceder a una estadística diaria de cuantos rindieron
el examen, cuantos aprobaron, reprobaron o estuvieron ausentes
 */
namespace InterLayer.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Examen()
        {
            return View();
        }

        public IActionResult PasswordEnterWindow()
        {
            return View();
        }

        public class Pregunta
        {
            public string text { get; set; }
            public List<SelectListItem> options { get; set; }
            public int correctAnswer { get; set; }
            public Pregunta()
            {

            }
            public Pregunta(string text, string ido1, string ido2, string ido3, string ido4, string option1, string option2, string option3, string option4, int correctAnswer)
            {
                this.text = text;
                this.options = new List<SelectListItem> { new SelectListItem(option1,ido1), new SelectListItem(option2, ido2), new SelectListItem(option3, ido3), new SelectListItem(option4, ido4) };
                this.correctAnswer = correctAnswer;
            }
        }

        public List<Pregunta> CurrentQuestions;

        //Views: 
        //ExamenAnteojos. Aca solo mostrar texto de turno a concurir
        //Failed: solo decir "Ya terminaron los 3 intentos. Pruebe despues"
        //PasswordGived: mostrar contraseña y mensaje "Por favor, utilize esta contraseña para ingresar a examen dentro proxima hora"
        //PasswordEnterWindow: una ventana selcionable en el menu para poder ingresar la contraña y asi ir al examen
        //PasswordInvalid: pagina donde muestra q no hay contraseña dada
        //ExamenPreguntas: pagina donde muestra preguntas a responder por el usuario
        //ExamenDesaprobado: mostrar puntaje y turno para ir para revision.
        //ExamenApprobado: felecitar, mencionar que puede ir a retirar su licencia.
        [HttpPost]
        public async Task<ActionResult> Anteojos(bool answer, string dni)
        {
            ViewBag.answer = answer;
            ViewBag.dni = dni;

            using HttpResponseMessage response = await new HttpClient().GetAsync(
            "http://localhost:5253/Backend/attempts?dni=" + dni);
            int attempts = Convert.ToInt32(response.Content.ReadAsStringAsync().Result);
            if (attempts >= 3)//TODO: Populate with real data
                return View("Failed");
            if (answer)
            {
                var turno = await new HttpClient().GetAsync(
                    "http://localhost:5253/Backend/appoitment").Result.Content.ReadAsStringAsync();
                ViewBag.turno = turno;
                return View("ExamenAnteojos");
            }
            else
            {
                var password = await new HttpClient().PostAsync(
                "http://localhost:5253/Backend/password?dni="+dni, null).Result.Content.ReadAsStringAsync();
                ViewBag.password = password;//TODO: Populate with real data
                return View("PasswordGived");

            }
        }


        [HttpPost]
        public async Task<ActionResult> EnterExamen(string password)
        {
            using HttpResponseMessage response = await new HttpClient().PostAsync(
            "http://localhost:5253/Backend/questions?password="+password, null);

            response.EnsureSuccessStatusCode();
            var text = response.Content.ReadAsStringAsync().Result;
            var list = response.Content.ReadFromJsonAsync<List<Pregunta>>().Result;
            
            if (list.Count == 0)
                return View("PasswordInvalid");

            ViewBag.password = password;
            ViewBag.preguntas = list;
            ViewBag.password = password;
            this.CurrentQuestions = list;
            //Generar preguntas, mandarlos
            return View("ExamenPreguntas");
        }


        [HttpPost]
        public async Task<ActionResult> ResponderExamen(string password, string answer1, string answer2, string answer3, string answer4, string answer5, string answer6, string answer7, string answer8, string answer9, string answer10)
        {
            var list = new List<string> { answer1, answer2, answer3, answer4, answer5, answer6, answer7, answer8, answer9, answer10 };
            var result = await new HttpClient().PostAsync(
            "http://localhost:5253/Backend/answers", JsonContent.Create(list)).Result.Content.ReadFromJsonAsync<bool>();

            //Make check against lists answers to db. Db should know which answers are correct ones
            if (result)
                return View("ExamenAprobado");
            else
                return View("ExamenDesaprobado");

        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
using Microsoft.AspNetCore.Mvc.Rendering;

namespace Backend
{
    [Serializable]
    public class Question
    {
        public string text { get; set; }
        public List<SelectListItem> options { get; set; }
        public int correctAnswer { get; set; }
        public Question(string text, string ido1, string ido2, string ido3, string ido4, string option1, string option2, string option3, string option4, int correctAnswer)
        {
            this.text = text;
            this.options = new List<SelectListItem> { new SelectListItem(option1, ido1), new SelectListItem(option2, ido2), new SelectListItem(option3, ido3), new SelectListItem(option4, ido4) };
            this.correctAnswer = correctAnswer;
        }
    }
}
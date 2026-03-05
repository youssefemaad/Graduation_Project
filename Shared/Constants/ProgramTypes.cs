namespace IntelliFit.Shared.Constants
{
   
    public static class ProgramTypes
    {
        
        public const string Workout = "Workout";
        public const string Nutrition = "Nutrition";

        public static bool IsValid(string programType)
        {
            return programType == Workout || programType == Nutrition;
        }

        public static string[] GetAll() => new[] { Workout, Nutrition };
    }
}

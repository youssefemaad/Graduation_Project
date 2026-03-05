using System;

namespace IntelliFit.Domain.Models
{
    public class EquipmentCategory
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = null!;
        public string? Description { get; set; }
        public string? Icon { get; set; }


        // Navigation properties

        public virtual ICollection<Equipment> Equipment { get; set; } = new List<Equipment>();
    }
}


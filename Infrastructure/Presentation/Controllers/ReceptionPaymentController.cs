using ServiceAbstraction;
using Core.ServiceAbstraction.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.DTOs.Reception;

namespace Presentation.Controllers;

[ApiController]
[Route("api/reception/payments")]
[Authorize(Roles = "Receptionist,Admin")]
public class ReceptionPaymentController : ControllerBase
{
    private readonly IServiceManager _serviceManager;

    public ReceptionPaymentController(IServiceManager serviceManager)
    {
        _serviceManager = serviceManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetPayments([FromQuery] PaymentFilterDto filter)
    {
        try
        {
            var result = await _serviceManager.ReceptionPaymentService.GetPaymentsAsync(filter);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        try
        {
            var stats = await _serviceManager.ReceptionPaymentService.GetPaymentStatsAsync();
            return Ok(new { success = true, data = stats });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("{paymentId:int}")]
    public async Task<IActionResult> GetPaymentById(int paymentId)
    {
        try
        {
            var payment = await _serviceManager.ReceptionPaymentService.GetPaymentByIdAsync(paymentId);
            
            if (payment == null)
                return NotFound(new { success = false, message = "Payment not found" });

            return Ok(new { success = true, data = payment });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> ProcessPayment([FromBody] PaymentCreateDto paymentDto)
    {
        try
        {
            var payment = await _serviceManager.ReceptionPaymentService.ProcessPaymentAsync(paymentDto);
            return Ok(new { success = true, data = payment, message = "Payment processed successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("{paymentId:int}/refund")]
    public async Task<IActionResult> RefundPayment(int paymentId, [FromBody] RefundRequestDto request)
    {
        try
        {
            var success = await _serviceManager.ReceptionPaymentService.RefundPaymentAsync(paymentId, request.Reason ?? "No reason provided");
            
            if (!success)
                return BadRequest(new { success = false, message = "Unable to refund payment" });

            return Ok(new { success = true, message = "Payment refunded successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("{paymentId:int}/invoice")]
    public async Task<IActionResult> DownloadInvoice(int paymentId)
    {
        try
        {
            var pdfBytes = await _serviceManager.ReceptionPaymentService.GenerateInvoicePdfAsync(paymentId);
            return File(pdfBytes, "application/pdf", $"Invoice-{paymentId}.pdf");
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("{paymentId:int}/email-invoice")]
    public async Task<IActionResult> EmailInvoice(int paymentId)
    {
        try
        {
            var success = await _serviceManager.ReceptionPaymentService.SendInvoiceEmailAsync(paymentId);
            
            if (!success)
                return BadRequest(new { success = false, message = "Failed to send invoice email" });

            return Ok(new { success = true, message = "Invoice sent successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}

public class RefundRequestDto
{
    public string? Reason { get; set; }
}

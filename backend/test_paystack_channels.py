"""Focused tests for Paystack channel mapping and statement method persistence."""
from app.payments import _paystack_channels_for, normalise_payment_channel


def test_selected_methods_map_to_only_the_requested_paystack_channel():
    assert _paystack_channels_for('any') == ['card', 'mobile_money', 'bank_transfer']
    assert _paystack_channels_for('card') == ['card']
    assert _paystack_channels_for('mobile_money') == ['mobile_money']
    assert _paystack_channels_for('bank_transfer') == ['bank_transfer']


def test_verified_channels_normalise_to_statement_methods():
    assert normalise_payment_channel('card') == 'card'
    assert normalise_payment_channel('mobile_money') == 'mobile_money'
    assert normalise_payment_channel('bank_transfer') == 'bank_transfer'
    assert normalise_payment_channel('bank') == 'bank_transfer'
    assert normalise_payment_channel('ussd') is None
    assert normalise_payment_channel('') is None


if __name__ == '__main__':
    test_selected_methods_map_to_only_the_requested_paystack_channel()
    test_verified_channels_normalise_to_statement_methods()
    print('ALL PAYSTACK CHANNEL CHECKS PASSED')
